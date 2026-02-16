import { nextState } from "./model";
import * as ACTIONS from "./actions";
import {
    ACCOUNT_DONOR_TYPE,
    CHANGE_TYPE_UPGRADE,
    CONTACT_DONOR_TYPE,
    CHANGE_TYPE_DOWNGRADE,
    PERIOD,
    RECURRING_PERIOD_ADVANCED,
    RECURRING_TYPE_OPEN,
    RECURRING_TYPE_FIXED,
} from "./constants.js";

import getInitialView from "@salesforce/apex/RD2_EntryFormController.getInitialView";
import saveRecurringDonation from "@salesforce/apex/RD2_EntryFormController.saveRecurringDonation";

class Rd2Service {
    dispatch(state, action) {
        return nextState(state, action);
    }

    init() {
        return this.dispatch();
    }

    async loadInitialView(state, recordId, parentId) {
        try {
            const initialView = await getInitialView({ recordId, parentId });
            const action = { type: ACTIONS.INITIAL_VIEW_LOAD, payload: initialView };
            return this.dispatch(state, action);
        } catch (ex) {
            // Dispatch error is swallowed; state is returned unchanged
            return state;
        }
    }

    async save(rd2State) {
        let result;
        try {
            const saveRequest = this.getSaveRequest(rd2State);
            result = await saveRecurringDonation({ saveRequest });
        } catch (ex) {
            console.error(ex);
        }
        return result;
    }

    getPlannedInstallments(rd2State) {
        if (this.isOpenLength(rd2State)) {
            return null;
        }
        return rd2State.plannedInstallments;
    }

    getCustomFieldValues({ customFieldSets }) {
        let fieldValues = {};
        for (const field of customFieldSets) {
            fieldValues[field.apiName] = field.value;
        }
        return fieldValues;
    }

    getSaveRequest(rd2State) {
        const {
            recordId,
            recordName,
            recurringStatus,
            statusReason,
            contactId,
            accountId,
            dateEstablished,
            donationValue,
            currencyIsoCode,
            recurringPeriod,
            recurringFrequency,
            startDate,
            dayOfMonth,
            recurringType,
            campaignId,
            paymentMethod,
            changeType,
        } = rd2State;

        const plannedInstallments = this.getPlannedInstallments(rd2State);
        const customFieldValues = this.getCustomFieldValues(rd2State);

        return {
            recordId,
            recordName,
            recurringStatus,
            statusReason,
            contactId,
            accountId,
            dateEstablished,
            donationValue,
            currencyIsoCode,
            recurringPeriod,
            recurringFrequency,
            startDate,
            dayOfMonth,
            plannedInstallments,
            recurringType,
            campaignId,
            paymentMethod,
            customFieldValues,
            changeType,
        };
    }

    isOpenLength({ recurringType }) {
        return recurringType === RECURRING_TYPE_OPEN;
    }

    getOriginalPaymentMethod({ initialViewState }) {
        return initialViewState.paymentMethod;
    }

    isOriginalStatusClosed({ initialViewState }) {
        return this.isClosedStatus(initialViewState);
    }

    isClosedStatus({ closedStatusValues, recurringStatus }) {
        return closedStatusValues.includes(recurringStatus);
    }

    isPaymentMethodChanged(rd2State) {
        const originalPaymentMethod = this.getOriginalPaymentMethod(rd2State);
        const { paymentMethod } = rd2State;
        return originalPaymentMethod !== paymentMethod;
    }

    isAmountChanged(rd2State) {
        const originalAmount = rd2State.initialViewState.donationValue;
        const amount = rd2State.donationValue;
        return amount !== originalAmount;
    }

    isFrequencyChanged(rd2State) {
        const originalFrequency = rd2State.initialViewState.recurringFrequency;
        const frequency = rd2State.recurringFrequency;
        return originalFrequency !== frequency;
    }

    isPeriodChanged(rd2State) {
        const originalPeriod = rd2State.initialViewState.recurringPeriod;
        const period = rd2State.recurringPeriod;
        return originalPeriod !== period;
    }

    isCampaignChanged(rd2State) {
        const originalCampaignId = rd2State.initialViewState.campaignId;
        const campaignId = rd2State.campaignId;
        return originalCampaignId !== campaignId;
    }
}

export {
    Rd2Service,
    ACTIONS,
    PERIOD,
    RECURRING_PERIOD_ADVANCED,
    RECURRING_TYPE_FIXED,
    RECURRING_TYPE_OPEN,
    ACCOUNT_DONOR_TYPE,
    CONTACT_DONOR_TYPE,
    CHANGE_TYPE_DOWNGRADE,
    CHANGE_TYPE_UPGRADE,
};
