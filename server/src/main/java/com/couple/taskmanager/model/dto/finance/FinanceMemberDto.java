package com.couple.taskmanager.model.dto.finance;

import com.couple.taskmanager.model.CTMUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinanceMemberDto {
    private String userId;
    private String name;
    private String iconUrl;
    private Double proratedPercentage;

    public FinanceMemberDto(CTMUser user) {
        this.userId = String.valueOf(user.getId());
        this.name = user.getName();
        this.iconUrl = user.getImageUrl();
        this.proratedPercentage = user.getProratedPercentage();
    }
}