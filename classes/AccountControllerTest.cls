@IsTest
public with sharing class AccountControllerTest {
    @testSetup static void setup() {

        List<Account> testAccs = new List<Account>();
        for(Integer i = 0; i < 2; i++) {
            Account a = new Account(
                Name = 'Name' + i,
                Rating = 'Hot'
            );
            testAccs.add(a);
        }
        insert testAccs;
    }

    @isTest static void testGetAccounts() {
       
        List<Account> testAccs = new List<Account>();
        testAccs = AccountController.getAccounts();
        System.assertEquals(2, testAccs.size(), 'receipted incorrect count of Accounts');
    }
}
