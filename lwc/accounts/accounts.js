import { LightningElement, track, wire } from 'lwc';

import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';

import getAccounts from '@salesforce/apex/AccountController.getAccounts';

const COLUMNS = [
    { label: 'Name', fieldName: 'Name', type: 'text', editable: {fieldName: 'controlEditName'}  },
    {
        label: 'Rating', fieldName: 'Rating', type: 'picklist', typeAttributes: {
            placeholder: 'Choose rating'
            , options: [
                { label: 'Hot', value: 'Hot' },
                { label: 'Warm', value: 'Warm' },
                { label: 'Cold', value: 'Cold' },
            ] // list of all picklist options
            , value: { fieldName: 'Rating' } // default value for picklist
            , context: { fieldName: 'Id' } // binding account Id with context variable to be returned back
            , iseditable: { fieldName: 'controlEditRating' }
        },
    },
    { label: '', type: "button-icon", fixedWidth: 100, typeAttributes: {
        name: 'Delete',
        iconName: 'utility:delete',
        class: 'slds-m-left_xx-small',
        variant: 'bare',
        title: 'Delete',
} },
];

export default class Accounts extends LightningElement {

    @track draftValues = [];
    lastSavedData = [];

    columns = COLUMNS;

    wiredAccountResult;

    @track accounts;
    @track error;

    @wire(getAccounts)
    imperativeWiring(result) {
        this.wiredAccountResult = result;
        const { data, error } = result;
        if(data) {
            this.accounts = data.map(function(item) {
                return {
                    'Id' : item.Id,
                    'Name' : item.Name,
                    'Rating' : item.Rating,
                    'controlEditName' : true,
                    'controlEditRating' : true,
                }
            });
            //save last saved copy
            this.lastSavedData = this.accounts;
        }
    }

    updateDataValues(updateItem) {
        let copyData = [... this.accounts];
        copyData.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });

        //write changes back to original data
        this.data = [...copyData];
    }

    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        //store changed value to do operations
        //on save. This will enable inline editing &
        //show standard cancel & save button
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });

        this.blockEditable();

        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }

    blockEditable() {
        this.accounts = this.accounts.map(function(item) {
            return {
                ...item,
                'controlEditName' : false,
                'controlEditRating' : false,
            }
        });
    }

    unblockEditable() {
        this.accounts = this.accounts.map(function(item) {
            return {
                ...item,
                'controlEditName' : true,
                'controlEditRating' : true,
            }
        });
    }

    //listener handler to get the context and data
    //updates datatable
    picklistChanged(event) {
        event.stopPropagation();
        let dataRecieved = event.detail.data;
        let updatedItem = { Id: dataRecieved.context, Rating: dataRecieved.value };
        this.updateDraftValues(updatedItem);
        this.updateDataValues(updatedItem);
    }

    //handler to handle cell changes & update values in draft values
    handleCellChange(event) {
        this.updateDraftValues(event.detail.draftValues[0]);
    }

    handleSave(event) {
        const fields = {}; 
        fields['Id'] = event.detail.draftValues[0].Id;
        fields['Name'] = event.detail.draftValues[0].Name;
        fields['Rating'] = event.detail.draftValues[0].Rating;

        const recordInput = {fields};

        updateRecord(recordInput)
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account updated',
                    variant: 'success'
                })
            );
            return refreshApex(this.wiredAccountResult).then(() => {
                this.draftValues = [];
            });
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating or reloading record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });

        //save last saved copy
        this.lastSavedData = this.accounts;

        this.unblockEditable();
    }

    handleCancel(event) {
        //remove draftValues & revert data changes
        this.accounts = this.lastSavedData;
        this.draftValues = [];
        this.unblockEditable();
    }

    handleRowAction(event) {
        if (event.detail.action.name === 'Delete') {
            const recordId = event.detail.row.Id;
            deleteRecord(recordId)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account deleted',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredAccountResult);
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            })    
        }
    }

}

