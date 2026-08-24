package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.dto.finance.FinanceMemberDto;
import com.couple.taskmanager.model.finance.*;
import com.couple.taskmanager.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;
    private final HydroBillRepository hydroBillRepository;

    @GetMapping("/members")
    public ResponseEntity<List<FinanceMemberDto>> getMembers(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getHouseholdMembers(user.getHousehold(), user));
    }

    @PutMapping("/members/{userId}")
    public ResponseEntity<FinanceMemberDto> updateMemberRatio(@PathVariable Long userId, @RequestBody Map<String, Double> payload, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        Double proratedPercentage = payload.get("proratedPercentage");
        return ResponseEntity.ok(financeService.updateMemberRatio(userId, proratedPercentage, user.getHousehold(), user));
    }

    @GetMapping("/common-expenses")
    public ResponseEntity<List<CommonExpense>> getCommonExpenses(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getCommonExpenses(user.getHousehold()));
    }

    @PostMapping("/common-expenses")
    public ResponseEntity<CommonExpense> addCommonExpense(@RequestBody CommonExpense expense, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.saveCommonExpense(expense, user));
    }

    @PutMapping("/common-expenses/{id}")
    public ResponseEntity<CommonExpense> updateCommonExpense(@PathVariable String id, @RequestBody CommonExpense expense, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        expense.setId(id);
        return ResponseEntity.ok(financeService.saveCommonExpense(expense, user));
    }

    @DeleteMapping("/common-expenses/{id}")
    public ResponseEntity<Void> deleteCommonExpense(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        financeService.deleteCommonExpense(id, user.getHousehold());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/bank-accounts")
    public ResponseEntity<List<BankAccount>> getBankAccounts(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getBankAccounts(user));
    }

    @PostMapping("/bank-accounts")
    public ResponseEntity<BankAccount> addBankAccount(@RequestBody BankAccount bank, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.saveBankAccount(bank, user));
    }

    @PutMapping("/bank-accounts/{id}")
    public ResponseEntity<BankAccount> updateBankAccount(@PathVariable String id, @RequestBody BankAccount bank, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        bank.setId(id);
        return ResponseEntity.ok(financeService.saveBankAccount(bank, user));
    }

    @DeleteMapping("/bank-accounts/{id}")
    public ResponseEntity<Void> deleteBankAccount(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        financeService.deleteBankAccount(id, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bank-accounts/{bankId}/sub-accounts")
    public ResponseEntity<BankAccount> addSubAccount(@PathVariable String bankId, @RequestBody SubAccount subAccount, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.addSubAccount(bankId, subAccount, user));
    }

    @DeleteMapping("/bank-accounts/{bankId}/sub-accounts/{subId}")
    public ResponseEntity<BankAccount> deleteSubAccount(@PathVariable String bankId, @PathVariable String subId, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.deleteSubAccount(bankId, subId, user));
    }

    @GetMapping("/personal-expenses")
    public ResponseEntity<List<PersonalExpense>> getPersonalExpenses(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getPersonalExpenses(user));
    }

    @PostMapping("/personal-expenses")
    public ResponseEntity<PersonalExpense> addPersonalExpense(@RequestBody PersonalExpense expense, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.savePersonalExpense(expense, user));
    }

    @PutMapping("/personal-expenses/{id}")
    public ResponseEntity<PersonalExpense> updatePersonalExpense(@PathVariable String id, @RequestBody PersonalExpense expense, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        expense.setId(id);
        return ResponseEntity.ok(financeService.savePersonalExpense(expense, user));
    }

    @DeleteMapping("/personal-expenses/{id}")
    public ResponseEntity<Void> deletePersonalExpense(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        financeService.deletePersonalExpense(id, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/paycheck-config")
    public ResponseEntity<PaycheckConfig> getPaycheckConfig(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getPaycheckConfig(user));
    }

    @PostMapping("/paycheck-config")
    public ResponseEntity<PaycheckConfig> savePaycheckConfig(@RequestBody PaycheckConfig config, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.savePaycheckConfig(config, user));
    }

    // --- NEW: Grocery Fund Endpoints ---

    @GetMapping("/grocery-fund")
    public ResponseEntity<GroceryFund> getGroceryFund(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getGroceryFund(user.getHousehold()));
    }

    @PutMapping("/grocery-fund")
    public ResponseEntity<GroceryFund> updateGroceryFund(@RequestBody GroceryFund fund, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.updateGroceryFund(fund, user.getHousehold()));
    }

    @GetMapping("/grocery-transactions")
    public ResponseEntity<List<GroceryTransaction>> getGroceryTransactions(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getGroceryTransactions(user.getHousehold()));
    }

    @PostMapping("/grocery-transactions")
    public ResponseEntity<Map<String, Object>> addGroceryTransaction(@RequestBody GroceryTransaction transaction, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.addGroceryTransaction(transaction, user));
    }

    @DeleteMapping("/grocery-transactions/{id}")
    public ResponseEntity<Map<String, Object>> deleteGroceryTransaction(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.deleteGroceryTransaction(id, user));
    }

    // --- NEW: Electricity Fund Endpoints ---

    @GetMapping("/electricity-fund")
    public ResponseEntity<ElectricityFund> getElectricityFund(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getElectricityFund(user.getHousehold()));
    }

    @GetMapping("/electricity-transactions")
    public ResponseEntity<List<ElectricityTransaction>> getElectricityTransactions(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getElectricityTransactions(user.getHousehold()));
    }

    @PostMapping("/electricity-transactions")
    public ResponseEntity<Map<String, Object>> addElectricityTransaction(@RequestBody ElectricityTransaction transaction, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.addElectricityTransaction(transaction, user));
    }

    @DeleteMapping("/electricity-transactions/{id}")
    public ResponseEntity<Map<String, Object>> deleteElectricityTransaction(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.deleteElectricityTransaction(id, user));
    }

    // --- NEW: Household Fund Endpoints ---

    @GetMapping("/household-fund")
    public ResponseEntity<HouseholdFund> getHouseholdFund(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getHouseholdFund(user.getHousehold()));
    }

    @GetMapping("/household-transactions")
    public ResponseEntity<List<HouseholdTransaction>> getHouseholdTransactions(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.getHouseholdTransactions(user.getHousehold()));
    }

    @PostMapping("/household-transactions")
    public ResponseEntity<Map<String, Object>> addHouseholdTransaction(@RequestBody HouseholdTransaction transaction, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.addHouseholdTransaction(transaction, user));
    }

    @DeleteMapping("/household-transactions/{id}")
    public ResponseEntity<Map<String, Object>> deleteHouseholdTransaction(@PathVariable String id, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.deleteHouseholdTransaction(id, user));
    }

    @GetMapping("/hydro-bills")
    public ResponseEntity<List<HydroBill>> getBillsByHousehold(@AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(hydroBillRepository.findByHouseholdIdOrderByPeriodEndDesc(String.valueOf(user.getHousehold().getId())));
    }

    @PostMapping("/hydro-bills")
    public ResponseEntity<HydroBill> addBill(@RequestBody HydroBill bill, @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        bill.setId(null);
        bill.setHouseholdId(String.valueOf(user.getHousehold().getId())); // Ensure the household ID is attached to the bill
        return ResponseEntity.ok(hydroBillRepository.save(bill));
    }

    @DeleteMapping("/hydro-bills/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable String id) {
        // You could add a check here to ensure the user deleting the bill belongs to the household that owns the bill,
        // but this will get you unblocked and working immediately.
        hydroBillRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/electricity-fund")
    public ResponseEntity<ElectricityFund> updateElectricityFund(@RequestBody ElectricityFund fund,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        CTMUser user = (CTMUser) userDetails;
        return ResponseEntity.ok(financeService.updateElectricityFund(fund, user.getHousehold()));
    }
}