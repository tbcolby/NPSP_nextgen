import { createElement } from "lwc";
import Rd2EntryForm from "c/rd2EntryForm";
import { RD2FormController, setupWireMocks } from "./rd2EntryFormTestHelpers";
import { getRecord, getRecordNotifyChange } from "lightning/uiRecordApi";

import getInitialView from "@salesforce/apex/RD2_EntryFormController.getInitialView";
import saveRecurringDonation from "@salesforce/apex/RD2_EntryFormController.saveRecurringDonation";

import RD2_EntryFormMissingPermissions from "@salesforce/label/c.RD2_EntryFormMissingPermissions";
import commonUnknownError from "@salesforce/label/c.commonUnknownError";
import RD2_EntryFormHeader from "@salesforce/label/c.RD2_EntryFormHeader";
import commonEdit from "@salesforce/label/c.commonEdit";

const contactGetRecord = require("./data/contactGetRecord.json");
const accountGetRecord = require("./data/accountGetRecord.json");
const initialViewResponse = require("../../../../../../tests/__mocks__/apex/data/getInitialView.json");

jest.mock("@salesforce/apex/RD2_EntryFormController.getInitialView", () => ({ default: jest.fn() }), { virtual: true });
jest.mock("@salesforce/apex/RD2_EntryFormController.saveRecurringDonation", () => ({ default: jest.fn() }), {
    virtual: true,
});

const mockScrollIntoView = jest.fn();
const mockHandleCloseModal = jest.fn();

const FAKE_ACH_RD2_ID = "a0963000008pebAAAQ";

describe("c-rd2-entry-form", () => {
    beforeEach(() => {
        getInitialView.mockResolvedValue({
            ...initialViewResponse,
        });
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    });

    afterEach(() => {
        clearDOM();
        jest.clearAllMocks();
    });

    describe("creating new records", () => {
        it("displays an error when user does not have required permissions", async () => {
            getInitialView.mockResolvedValue({
                hasRequiredFieldPermissions: false,
            });

            const element = createRd2EntryForm();
            const controller = new RD2FormController(element);

            await flushPromises();

            expect(mockScrollIntoView).toHaveBeenCalled();

            const saveButton = controller.saveButton();
            expect(saveButton.disabled).toBe(true);

            const formattedText = element.shadowRoot.querySelector("lightning-formatted-text");
            expect(formattedText.value).toBe(RD2_EntryFormMissingPermissions);
        });

        it("displays label for new recurring donations in header", () => {
            const element = createRd2EntryForm();
            const controller = new RD2FormController(element);
            const header = controller.header();

            expect(header).toBeTruthy();
            expect(header.textContent).toBe(RD2_EntryFormHeader);
        });

        it("renders custom fields when one field is defined", async () => {
            getInitialView.mockResolvedValue({
                ...initialViewResponse,
                customFieldSets: [
                    {
                        apiName: "Custom1__c",
                        required: false,
                    },
                ],
            });

            const element = createRd2EntryForm();
            const controller = new RD2FormController(element);

            await flushPromises();

            expect(controller.customFieldsSection()).toBeTruthy();
            const customFields = controller.customFields();
            expect(customFields).toHaveLength(1);
            expect(customFields[0].fieldName).toBe("Custom1__c");
            expect(customFields[0].required).toBe(false);
        });

        it("when auto naming enabled, allows user to update name field", async () => {
            getInitialView.mockResolvedValue({
                ...initialViewResponse,
                isAutoNamingEnabled: false,
            });

            saveRecurringDonation.mockResolvedValue({
                success: true,
                recordId: FAKE_ACH_RD2_ID,
                recordName: "Some Test Name",
            });

            const element = createRd2EntryForm();
            const controller = new RD2FormController(element);
            await flushPromises();
            await setupWireMocks();

            const nameField = controller.recordName();
            expect(nameField).toBeTruthy();
            nameField.changeValue("Some Test Name");
            controller.contactLookup().changeValue("001fakeContactId");
            controller.amount().changeValue(1.0);
            controller.paymentMethod().changeValue("Check");

            controller.saveButton().click();

            expect(saveRecurringDonation).toHaveBeenCalledWith({
                saveRequest: {
                    campaignId: null,
                    changeType: "",
                    currencyIsoCode: null,
                    dayOfMonth: "15",
                    paymentMethod: "Check",
                    recordId: null,
                    recordName: "Some Test Name",
                    recurringFrequency: 1,
                    recurringType: "Open",
                    recurringStatus: null,
                    startDate: "2021-02-03",
                    donationValue: 1,
                    contactId: "001fakeContactId",
                    accountId: null,
                    dateEstablished: "2021-02-03",
                    recurringPeriod: "Monthly",
                    plannedInstallments: null,
                    statusReason: null,
                    customFieldValues: {},
                },
            });
        });

        it("when multicurrency enabled, displays currency field", async () => {
            getInitialView.mockResolvedValue({
                ...initialViewResponse,
                isMultiCurrencyEnabled: true,
            });

            const element = createRd2EntryForm();
            await flushPromises();

            await setupWireMocks();

            const controller = new RD2FormController(element);

            const currencyIsoCodeField = controller.currencyIsoCode();
            expect(currencyIsoCodeField.element).toBeTruthy();
        });

        it("when single validation rule triggers on save, displays error on screen", async () => {
            const element = createRd2EntryForm();
            await flushPromises();

            await setupWireMocks();
            const controller = new RD2FormController(element);

            saveRecurringDonation.mockResolvedValue({
                success: false,
                errors: [
                    {
                        message: "Invalid endpoint.",
                        fields: [],
                    },
                ],
            });

            controller.contactLookup().changeValue("001fakeContactId");
            controller.amount().changeValue(1.0);
            controller.paymentMethod().changeValue("Check");

            controller.saveButton().click();

            await flushPromises();

            expect(saveRecurringDonation).toHaveBeenCalled();
            const errorPageLevelMessage = controller.errorPageLevelMessage();
            expect(errorPageLevelMessage).toBeTruthy();
            expect(errorPageLevelMessage.title).toBe(commonUnknownError);
            const errorFormattedText = controller.errorFormattedText();
            expect(errorFormattedText.value).toBe("Invalid endpoint.");
        });
    });

    describe("editing existing record", () => {
        it("when Bank Payment is enabled, displays ACH option for Payment Methods field", async () => {
            getInitialView.mockResolvedValue({
                isBankPaymentAllowed: true,
            });

            const element = createRd2EntryForm();
            const controller = new RD2FormController(element);

            await flushPromises();

            expect(mockScrollIntoView).toHaveBeenCalled();

            const saveButton = controller.saveButton();
            expect(saveButton.disabled).toBe(true);

            const achOption = element.shadowRoot.querySelector('[value="ACH"]');
            expect(achOption).toBeDefined();
        });

        it("when Bank Payment is not enabled, do not displays ACH option for Payment Methods field", async () => {
            getInitialView.mockResolvedValue({
                isBankPaymentAllowed: false,
            });

            const element = createRd2EntryForm();
            const controller = new RD2FormController(element);

            await flushPromises();

            expect(mockScrollIntoView).toHaveBeenCalled();

            const saveButton = controller.saveButton();
            expect(saveButton.disabled).toBe(true);

            const achOption = element.shadowRoot.querySelector('[value="ACH"]');
            expect(achOption).toBeNull();
        });

        it("on update of record, informs LDS the record has been updated", async () => {
            getInitialView.mockResolvedValue({
                ...initialViewResponse,
                record: {
                    ...initialViewResponse.record,
                    recordId: FAKE_ACH_RD2_ID,
                    recurringStatus: "Active",
                },
            });

            const element = createRd2EntryForm();
            await flushPromises();

            await setupWireMocks();
            const controller = new RD2FormController(element);

            saveRecurringDonation.mockResolvedValue({
                success: true,
                recordId: FAKE_ACH_RD2_ID,
                recordName: "Test Record Name",
            });

            controller.contactLookup().changeValue("001fakeContactId");
            controller.amount().changeValue(1.0);
            controller.paymentMethod().changeValue("Check");

            controller.saveButton().click();

            await flushPromises();

            expect(getRecordNotifyChange).toHaveBeenCalledWith([{ recordId: FAKE_ACH_RD2_ID }]);
        });
    });
});

const createRd2EntryForm = () => {
    const element = createElement("c-rd2-entry-form", { is: Rd2EntryForm });
    element.addEventListener("closemodal", mockHandleCloseModal);
    document.body.appendChild(element);
    return element;
};
