public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
    
        return [
            SELECT Name, Rating
            FROM Account
            WITH SECURITY_ENFORCED
            LIMIT 50
        ];
    }
}
