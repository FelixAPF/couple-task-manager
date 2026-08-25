package com.couple.taskmanager.service;

import com.couple.taskmanager.controller.HydroBillRepository;
import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Household;
import com.couple.taskmanager.model.dto.HouseholdDto;
import com.couple.taskmanager.model.dto.HouseholdMemberDto;
import com.couple.taskmanager.model.dto.UpdateHouseholdSettingsDto;
import com.couple.taskmanager.model.finance.HydroBill;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.repository.finance.GroceryTransactionRepository;
import com.couple.taskmanager.repository.finance.HouseholdTransactionRepository;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.couple.taskmanager.model.*;
import com.couple.taskmanager.model.dto.*;
import com.couple.taskmanager.model.finance.GroceryTransaction;
import com.couple.taskmanager.model.finance.HouseholdFund;
import com.couple.taskmanager.model.finance.HouseholdTransaction;
import com.couple.taskmanager.repository.*;
import com.couple.taskmanager.repository.finance.GroceryTransactionRepository;
import com.couple.taskmanager.repository.finance.HouseholdFundRepository;
import com.couple.taskmanager.repository.finance.HouseholdTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HouseholdService {@Autowired
    private HouseholdRepository repository;

    @Autowired
    private CTMUserRepository userRepository;

    @Autowired
    private MealRepository mealRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private HydroBillRepository hydroBillRepository;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private GroceryTransactionRepository groceryTransactionRepository;

    @Autowired
    private HouseholdTransactionRepository householdTransactionRepository;

    @Autowired
    private HouseholdFundRepository householdFundRepository;
    /**
     * Aggregates stats for the current year in progress for the user's household.
     */
    public HouseholdStatsDto getHouseholdStats(CTMUser user, Integer targetYear) {
        int year = (targetYear != null) ? targetYear : Calendar.getInstance().get(Calendar.YEAR);

        Calendar cal = Calendar.getInstance();
        cal.set(year, Calendar.JANUARY, 1, 0, 0, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date startOfYear = cal.getTime();

        cal.set(year, Calendar.DECEMBER, 31, 23, 59, 59);
        cal.set(Calendar.MILLISECOND, 999);
        Date endOfYear = cal.getTime();

        Long householdId = user.getHousehold().getId();

        // 1. Meals & Top 3 Recipes
        List<Meal> mealsThisYear = mealRepository.findByDateBetweenAndHouseholdId(startOfYear, endOfYear, householdId);
        long totalMealsCount = mealsThisYear.size();

        Map<Long, List<Meal>> mealsByRecipe = mealsThisYear.stream()
                .filter(m -> m.getRecipe() != null && m.getRecipe().getId() != null)
                .collect(Collectors.groupingBy(m -> m.getRecipe().getId()));

        List<TopMealDto> topMeals = mealsByRecipe.values().stream()
                .map(list -> {
                    Meal sample = list.get(0);
                    Recipe recipe = sample.getRecipe();
                    Date mostRecent = list.stream()
                            .map(Meal::getDate)
                            .filter(Objects::nonNull)
                            .max(Date::compareTo)
                            .orElse(null);

                    return TopMealDto.builder()
                            .recipeId(recipe.getId())
                            .recipeName(recipe.getName())
                            .category(recipe.getCategory() != null ? recipe.getCategory().name() : "AUTRE")
                            .imageUrl(recipe.getImageUrl())
                            .count(list.size())
                            .lastEaten(mostRecent)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .limit(3)
                .collect(Collectors.toList());

        // 2. Who Cooked the Most (Top Chef & Distribution)
        Map<Long, List<Meal>> mealsByChef = mealsThisYear.stream()
                .filter(m -> m.getAssignedUser() != null && m.getAssignedUser().getId() != null)
                .collect(Collectors.groupingBy(m -> m.getAssignedUser().getId()));

        long totalAssignedMeals = mealsByChef.values().stream().mapToInt(List::size).sum();

        List<MemberChefStatDto> memberChefStats = mealsByChef.values().stream()
                .map(list -> {
                    CTMUser chef = list.get(0).getAssignedUser();
                    long count = list.size();
                    int pct = totalAssignedMeals > 0 ? (int) Math.round((double) count / totalAssignedMeals * 100) : 0;
                    return MemberChefStatDto.builder()
                            .memberId(chef.getId())
                            .name(chef.getName())
                            .imageUrl(chef.getImageUrl())
                            .count(count)
                            .percentage(pct)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());

        MemberChefStatDto topChef = memberChefStats.isEmpty() ? null : memberChefStats.get(0);

        // 3. Tasks Done This Year & Member Breakdown
        List<TaskHistory> historiesThisYear = taskHistoryRepository.findByHouseholdIdAndCompletedDateBetween(
                householdId, startOfYear, endOfYear
        );
        long totalTasksDone = historiesThisYear.size();
        long totalActiveTasks = taskRepository.findAllByHouseholdId(householdId).size();

        Map<Long, List<TaskHistory>> byMember = historiesThisYear.stream()
                .filter(h -> h.getCompletedBy() != null && h.getCompletedBy().getId() != null)
                .collect(Collectors.groupingBy(h -> h.getCompletedBy().getId()));

        List<MemberTaskStatDto> memberTaskStats = byMember.values().stream()
                .map(list -> {
                    CTMUser member = list.get(0).getCompletedBy();
                    long count = list.size();
                    int pct = totalTasksDone > 0 ? (int) Math.round((double) count / totalTasksDone * 100) : 0;
                    return MemberTaskStatDto.builder()
                            .memberId(member.getId())
                            .name(member.getName())
                            .imageUrl(member.getImageUrl())
                            .count(count)
                            .percentage(pct)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());

        // 4. Grocery Spending
        List<GroceryTransaction> groceryTxs = groceryTransactionRepository.findByHouseholdIdAndDateBetween(
                householdId, startOfYear, endOfYear
        );
        double totalGrocerySpent = groceryTxs.stream()
                .filter(tx -> "SPEND".equalsIgnoreCase(tx.getTransactionType()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();

        // 5. Household Fund Savings & Balance
        List<HouseholdTransaction> householdTxs = householdTransactionRepository.findByHouseholdIdAndDateBetween(
                householdId, startOfYear, endOfYear
        );
        double totalHouseholdFundSaved = householdTxs.stream()
                .filter(tx -> "ADD".equalsIgnoreCase(tx.getTransactionType()))
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();

        double householdFundBalance = householdFundRepository.findByHouseholdId(householdId)
                .map(HouseholdFund::getBalance)
                .orElse(0.0);

        // 6. Hydro-Québec Electricity Consumption Cost & kWh
        LocalDateTime startLdt = LocalDateTime.of(year, 1, 1, 0, 0, 0);
        LocalDateTime endLdt = LocalDateTime.of(year, 12, 31, 23, 59, 59);

        List<HydroBill> allBills = hydroBillRepository.findByHouseholdIdOrderByPeriodEndDesc(String.valueOf(householdId));
        List<HydroBill> billsThisYear = allBills.stream()
                .filter(b -> b.getPeriodEnd() != null &&
                        !b.getPeriodEnd().isBefore(startLdt) &&
                        !b.getPeriodEnd().isAfter(endLdt))
                .toList();

        double totalHydroCost = billsThisYear.stream()
                .mapToDouble(b -> b.getAmount() != null ? b.getAmount() : 0.0)
                .sum();

        double totalHydroKwh = billsThisYear.stream()
                .mapToDouble(b -> b.getKwhConsumed() != null ? b.getKwhConsumed() : 0.0)
                .sum();

        return HouseholdStatsDto.builder()
                .year(year)
                .totalTasksDone(totalTasksDone)
                .totalActiveTasks(totalActiveTasks)
                .totalGrocerySpent(totalGrocerySpent)
                .totalHouseholdFundSaved(totalHouseholdFundSaved)
                .householdFundBalance(householdFundBalance)
                .totalHydroCost(totalHydroCost)
                .totalHydroKwh(totalHydroKwh)
                .totalMealsCount(totalMealsCount)
                .topMeals(topMeals)
                .memberTaskStats(memberTaskStats)
                .memberChefStats(memberChefStats)
                .topChef(topChef)
                .build();
    }

    public HouseholdDto getMemberHousehold(CTMUser user){
        Household household = repository.findById(user.getHousehold().getId()).orElseThrow(IllegalAccessError::new);
        HouseholdDto householdDto = new HouseholdDto(household);
        householdDto.setCurrentUser(new HouseholdMemberDto(user));
        return householdDto;
    }

    public Household getCurrentHousehold(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CTMUser currentUser = (CTMUser)authentication.getPrincipal();
        return repository.findById(currentUser.getHousehold().getId()).orElseThrow(IllegalAccessError::new);
    }

    public HouseholdDto joinHousehold(String joinKey, CTMUser user){
        Optional<Household> householdOptional = repository.findByToken(joinKey);
        if(householdOptional.isEmpty()) throw new NoSuchElementException();
        removeUserFromHousehold(user.getId(), user.getHousehold().getId());

        Household household = householdOptional.get();
        List<CTMUser> users = household.getUsers();
        users.add(user);
        household.setUsers(users);

        user.setHousehold(household);
        userRepository.save(user);

        return new HouseholdDto(repository.save(household));
    }

    public void removeUserFromHousehold(Long userId, Long householdId) {
        CTMUser user = userRepository.findById(userId).orElseThrow(NoSuchElementException::new);
        Household household = repository.findById(householdId).orElseThrow(NoSuchElementException::new);

        List<CTMUser> users = household.getUsers();
        users.remove(user);

        user.setHousehold(null); // 🚨 Important! Disconnect the reference.
        userRepository.save(user); // Make sure this is saved after removing reference

        if (users.isEmpty()) {
            repository.delete(household);
        } else {
            household.setUsers(users);
            repository.save(household);
        }
    }

    public void setHouseholdMemberImage(Long userId, String imageUrl){
        CTMUser user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId)); // Add specific message
        user.setImageUrl(imageUrl); // Save the full URL
        userRepository.save(user);
    }

    public HouseholdDto updateHouseholdSettings(UpdateHouseholdSettingsDto updateHouseholdSettingsDto, CTMUser user) throws SystemException {
        Household household = repository.findById(user.getHousehold().getId()).orElseThrow(SystemException::new);
        String newHouseholdName = updateHouseholdSettingsDto.getName();
        if(newHouseholdName != null && !newHouseholdName.isEmpty() && !newHouseholdName.equals(household.getName())){
            household.setName(newHouseholdName);
        }
        Boolean newEnableWaysToCare = updateHouseholdSettingsDto.getEnableWaysToCare();
        if(newEnableWaysToCare != null && !newEnableWaysToCare.equals(household.getEnableWaysToCare())){
            household.setEnableWaysToCare(newEnableWaysToCare);
        }
        Boolean newEnableToDoList = updateHouseholdSettingsDto.getEnableToDoList();
        if(newEnableToDoList != null && !newEnableToDoList.equals(household.getEnableToDoList())){
            household.setEnableToDoList(newEnableToDoList);
        }
        Boolean newEnableWishList = updateHouseholdSettingsDto.getEnableWishList();
        if(newEnableWishList != null && !newEnableWishList.equals(household.getEnableWishList())){
            household.setEnableWishList(newEnableWishList);
        }
        Boolean newEnableTravelChecklist = updateHouseholdSettingsDto.getEnableTravelChecklist();
        if(newEnableTravelChecklist != null && !newEnableTravelChecklist.equals(household.getEnableTravelChecklist())){
            household.setEnableTravelChecklist(newEnableTravelChecklist);
        }
        Boolean newEnableTrackingFoodIntake = updateHouseholdSettingsDto.getEnableFoodIntakeTracking();
        if(newEnableTrackingFoodIntake != null && !newEnableTrackingFoodIntake.equals(household.getEnableFoodIntakeTracking())){
            household.setEnableFoodIntakeTracking(newEnableTrackingFoodIntake);
        }
        Boolean newEnableMeal = updateHouseholdSettingsDto.getEnableMeal();
        if(newEnableMeal != null && !newEnableMeal.equals(household.getEnableMeal())){
            household.setEnableMeal(newEnableMeal);
        }
        Boolean newEnableTasks = updateHouseholdSettingsDto.getEnableTasks();
        if(newEnableTasks != null && !newEnableTasks.equals(household.getEnableTasks())){
            household.setEnableTasks(newEnableTasks);
        }
        Boolean newEnableShoppingList = updateHouseholdSettingsDto.getEnableShoppingList();
        if(newEnableShoppingList != null && !newEnableShoppingList.equals(household.getEnableShoppingList())){
            household.setEnableShoppingList(newEnableShoppingList);
        }
        return new HouseholdDto(repository.save(household));
    }

    public void increaseRewardPoints(Long memberId, CTMUser user) throws SystemException {
        CTMUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + memberId)); // Add specific message
        member.setRewardPoints(member.getRewardPoints()+1); // Save the full URL
        userRepository.save(member);
    }

    public void setHouseholdMemberRewardColor(Long userId, String color, CTMUser user) {
        CTMUser member = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + userId)); // Add specific message
        member.setRewardColor(color); // Save the full URL
        userRepository.save(member);
    }

    public void setRewardPoints(Long memberId, int points, CTMUser user) {
        CTMUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + memberId)); // Add specific message
        member.setRewardPoints(points); // Save the full URL
        userRepository.save(member);
    }
}
