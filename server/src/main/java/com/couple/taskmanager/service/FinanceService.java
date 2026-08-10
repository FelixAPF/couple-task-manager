package com.couple.taskmanager.service;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.finance.FinanceMemberDto;
import com.couple.taskmanager.model.finance.*;
import com.couple.taskmanager.repository.CTMUserRepository;
import com.couple.taskmanager.repository.HouseholdRepository;
import com.couple.taskmanager.repository.finance.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceService {

    private final CommonExpenseRepository commonExpenseRepository;
    private final BankAccountRepository bankAccountRepository;
    private final SubAccountRepository subAccountRepository;
    private final PersonalExpenseRepository personalExpenseRepository;
    private final PaycheckConfigRepository paycheckConfigRepository;
    private final GroceryFundRepository groceryFundRepository;
    private final GroceryTransactionRepository groceryTransactionRepository;
    private final CTMUserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final FirebaseMessagingService firebaseMessagingService;

    public List<FinanceMemberDto> getHouseholdMembers(Household household, CTMUser currentUser) {
        return householdRepository.findUsersByHouseholdId(household.getId())
                .stream()
                .map(u -> new FinanceMemberDto(u, u.getId().equals(currentUser.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public FinanceMemberDto updateMemberRatio(Long userId, Double newRatio, Household household, CTMUser currentUser) {
        CTMUser member = userRepository.findById(userId).orElseThrow(RuntimeException::new);
        if (!member.getHousehold().getId().equals(household.getId())) {
            throw new RuntimeException("User does not belong to your household");
        }
        member.setProratedPercentage(newRatio);
        return new FinanceMemberDto(userRepository.save(member), member.getId().equals(currentUser.getId()));
    }

    public List<CommonExpense> getCommonExpenses(Household household) {
        return commonExpenseRepository.findByHouseholdId(household.getId());
    }

    public CommonExpense saveCommonExpense(CommonExpense expense, CTMUser user) {
        Double oldAmount = null;
        if (expense.getId() != null && !expense.getId().isEmpty()) {
            Optional<CommonExpense> existingOpt = commonExpenseRepository.findById(expense.getId());
            if (existingOpt.isPresent()) {
                oldAmount = existingOpt.get().getAmount();
            }
        } else {
            expense.setId(null);
        }

        expense.setHousehold(user.getHousehold());
        CommonExpense saved = commonExpenseRepository.save(expense);

        if (oldAmount != null && !oldAmount.equals(saved.getAmount())) {
            CTMUser partner = getPartner(user);
            if (partner != null) {
                String message = String.format("%s a modifié la dépense commune '%s'. Le montant est passé de %.2f$ à %.2f$.",
                        user.getName(), saved.getName(), oldAmount, saved.getAmount());
                firebaseMessagingService.sendNotificationWithNavigation(
                        partner,
                        "Dépense commune mise à jour \uD83D\uDCB8",
                        message,
                        "FINANCE",
                        null
                );
            }
        }

        return saved;
    }

    public void deleteCommonExpense(String id, Household household) {
        CommonExpense expense = commonExpenseRepository.findById(id).orElseThrow(RuntimeException::new);
        if (expense.getHousehold().getId().equals(household.getId())) {
            commonExpenseRepository.deleteById(id);
        }
    }

    public List<BankAccount> getBankAccounts(CTMUser user) {
        return bankAccountRepository.findByUserId(user.getId());
    }

    public BankAccount saveBankAccount(BankAccount bankAccount, CTMUser user) {
        if (bankAccount.getId() != null && bankAccount.getId().isEmpty()) {
            bankAccount.setId(null);
        }
        bankAccount.setUser(user);
        if (bankAccount.getSubAccounts() != null) {
            bankAccount.getSubAccounts().forEach(sub -> {
                if (sub.getId() != null && sub.getId().isEmpty()) {
                    sub.setId(null);
                }
                sub.setBankAccount(bankAccount);
            });
        }
        return bankAccountRepository.save(bankAccount);
    }

    public void deleteBankAccount(String id, CTMUser user) {
        BankAccount bankAccount = bankAccountRepository.findById(id).orElseThrow(RuntimeException::new);
        if (bankAccount.getUser().getId().equals(user.getId())) {
            bankAccountRepository.deleteById(id);
        }
    }

    @Transactional
    public BankAccount addSubAccount(String bankId, SubAccount subAccount, CTMUser user) {
        BankAccount bank = bankAccountRepository.findById(bankId).orElseThrow(RuntimeException::new);
        if (!bank.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");

        if (subAccount.getId() != null && subAccount.getId().isEmpty()) {
            subAccount.setId(null);
        }
        subAccount.setBankAccount(bank);
        bank.getSubAccounts().add(subAccount);
        return bankAccountRepository.save(bank);
    }

    @Transactional
    public BankAccount deleteSubAccount(String bankId, String subId, CTMUser user) {
        BankAccount bank = bankAccountRepository.findById(bankId).orElseThrow(RuntimeException::new);
        if (!bank.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        bank.getSubAccounts().removeIf(sub -> sub.getId().equals(subId));
        return bankAccountRepository.save(bank);
    }

    public List<PersonalExpense> getPersonalExpenses(CTMUser user) {
        return personalExpenseRepository.findByUserId(user.getId());
    }

    public PersonalExpense savePersonalExpense(PersonalExpense expense, CTMUser user) {
        if (expense.getId() != null && expense.getId().isEmpty()) {
            expense.setId(null);
        }
        expense.setUser(user);
        return personalExpenseRepository.save(expense);
    }

    public void deletePersonalExpense(String id, CTMUser user) {
        PersonalExpense expense = personalExpenseRepository.findById(id).orElseThrow(RuntimeException::new);
        if (expense.getUser().getId().equals(user.getId())) {
            personalExpenseRepository.deleteById(id);
        }
    }

    public PaycheckConfig getPaycheckConfig(CTMUser user) {
        return paycheckConfigRepository.findByUserId(user.getId()).orElse(null);
    }

    public PaycheckConfig savePaycheckConfig(PaycheckConfig config, CTMUser user) {
        if (config.getId() != null && config.getId().isEmpty()) {
            config.setId(null);
        }
        config.setUser(user);

        Optional<PaycheckConfig> existingOpt = paycheckConfigRepository.findByUserId(user.getId());
        existingOpt.ifPresent(existing -> config.setId(existing.getId()));

        return paycheckConfigRepository.save(config);
    }

    // --- NEW: Grocery Fund Methods ---

    public GroceryFund getGroceryFund(Household household) {
        return groceryFundRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> {
                    GroceryFund newFund = new GroceryFund();
                    newFund.setHousehold(household);
                    newFund.setBalance(0.0);
                    return groceryFundRepository.save(newFund);
                });
    }

    public List<GroceryTransaction> getGroceryTransactions(Household household) {
        return groceryTransactionRepository.findByHouseholdIdOrderByDateDesc(household.getId());
    }

    @Transactional
    public Map<String, Object> deleteGroceryTransaction(String transactionId, CTMUser user) {
        Household household = user.getHousehold();

        GroceryTransaction transaction = groceryTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getHousehold().getId().equals(household.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        GroceryFund fund = getGroceryFund(household);

        // Reverse the balance impact
        if ("ADD".equalsIgnoreCase(transaction.getTransactionType())) {
            fund.setBalance(fund.getBalance() - transaction.getAmount());
        } else if ("SPEND".equalsIgnoreCase(transaction.getTransactionType())) {
            fund.setBalance(fund.getBalance() + transaction.getAmount());
        }

        GroceryFund savedFund = groceryFundRepository.save(fund);
        groceryTransactionRepository.delete(transaction);

        return Map.of("fund", savedFund);
    }
    @Transactional
    public Map<String, Object> addGroceryTransaction(GroceryTransaction transaction, CTMUser user) {
        Household household = user.getHousehold();

        transaction.setHousehold(household);
        transaction.setUser(user);
        if (transaction.getDate() == null) {
            transaction.setDate(new Date());
        }
        GroceryTransaction savedTransaction = groceryTransactionRepository.save(transaction);

        GroceryFund fund = getGroceryFund(household);
        if ("ADD".equalsIgnoreCase(transaction.getTransactionType())) {
            fund.setBalance(fund.getBalance() + transaction.getAmount());
        } else if ("SPEND".equalsIgnoreCase(transaction.getTransactionType())) {
            fund.setBalance(fund.getBalance() - transaction.getAmount());
        }
        GroceryFund savedFund = groceryFundRepository.save(fund);

        return Map.of(
                "fund", savedFund,
                "transaction", savedTransaction
        );
    }

    private CTMUser getPartner(CTMUser user) {
        if (user.getHousehold() == null) return null;
        return householdRepository.findUsersByHouseholdId(user.getHousehold().getId())
                .stream()
                .filter(u -> !u.getId().equals(user.getId()))
                .findFirst()
                .orElse(null);
    }
}