import _ from "lodash";
import { compose, withProps } from "recompose";
import { composeWithTracker, registerComponent } from  "@reactioncommerce/reaction-components";
import { Meteor } from "meteor/meteor";
import { Reaction, i18next } from "/client/api";
import { AvalaraPackageConfig } from "../../lib/collections/schemas";
import { AvalaraSettingsForm } from "../components";
import { Countries } from "/client/collections";

/**
 * @file This is a container for AvalaraSettingsForm.
 * @module avalaraSettingsFormContainer
 */

const handlers = {
  /**
    * handleSubmit
    * @method
    * @summary event handler for when new Avalara settings are submitted.
    * @param {Object} event - event info.
    * @param {Object} changedInfo - info about the new Avalara settings.
    * @param {String} targetField - where to save the new settings in the Avalara Package.
    * @since 1.5.2
    * @return {null} - returns nothing
    */
  handleSubmit(event, changedInfo, targetField) {
    if (!changedInfo.isValid) {
      return;
    }
    Meteor.call("package/update", "taxes-avalara", targetField, changedInfo.doc.settings.avalara, (error) => {
      if (error) {
        Alerts.toast(
          i18next.t("admin.update.updateFailed", { defaultValue: "Failed to update Avalara settings." }),
          "error"
        );
        return;
      }
      Alerts.toast(
        i18next.t("admin.update.updateSucceeded", { defaultValue: "Avalara settings updated." }),
        "success"
      );
    });
  },

  handleTestCredentials(event, settings) {
    Meteor.call("avalara/testCredentials", settings.avalara, function (error, result) {
      if (error && error.message) {
        return Alerts.toast(`${i18next.t("settings.testCredentialsFailed")} ${error.message}`, "error");
      }
      try {
        const statusCode = _.get(result, "statusCode");
        const connectionValid = _.inRange(statusCode, 400);
        if (connectionValid) {
          return Alerts.toast(i18next.t("settings.testCredentialsSuccess"), "success");
        }
        return Alerts.toast(i18next.t("settings.testCredentialsFailed"), "error");
      } catch (e) {
        return Alerts.toast(i18next.t("settings.testCredentialsFailed"), "error");
      }
    });
  }
};

const composer = (props, onData) => {
  const shownFields = {
    ["settings.avalara.apiLoginId"]: AvalaraPackageConfig._schema["settings.avalara.apiLoginId"],
    ["settings.avalara.username"]: AvalaraPackageConfig._schema["settings.avalara.username"],
    ["settings.avalara.password"]: AvalaraPackageConfig._schema["settings.avalara.password"],
    ["settings.avalara.companyCode"]: AvalaraPackageConfig._schema["settings.avalara.companyCode"],
    ["settings.avalara.shippingTaxCode"]: AvalaraPackageConfig._schema["settings.avalara.shippingTaxCode"],
    ["settings.addressValidation.enabled"]: AvalaraPackageConfig._schema["settings.addressValidation.enabled"],
    ["settings.addressValidation.countryList"]: AvalaraPackageConfig._schema["settings.addressValidation.countryList"],
    ["settings.avalara.requestTimeout"]: AvalaraPackageConfig._schema["settings.avalara.requestTimeout"],
    ["settings.avalara.mode"]: AvalaraPackageConfig._schema["settings.avalara.mode"],
    ["settings.avalara.performTaxCalculation"]: AvalaraPackageConfig._schema["settings.avalara.performTaxCalculation"],
    ["settings.avalara.enableLogging"]: AvalaraPackageConfig._schema["settings.avalara.enableLogging"],
    ["settings.avalara.logRetentionDuration"]: AvalaraPackageConfig._schema["settings.avalara.logRetentionDuration"],
    ["settings.avalara.commitDocuments"]: AvalaraPackageConfig._schema["settings.avalara.commitDocuments"]
  };
  const hiddenFields = [
    "settings.avalara.enabled",
    "settings.avalara.companyId",
    "settings.avalara.commitDocuments"
  ];

  // Avalara supports only Canada and US for address validation
  const countryDefaults = ["US", "CA"];
  const validCountries =  Countries.find({ value: { $in: countryDefaults } }).fetch();

  const fieldsProp = {
    "settings.addressValidation.countryList": {
      renderComponent: "multiselect",
      options: validCountries,
      defaultValue: _.map(validCountries, "value")
    },
    "settings.avalara.mode": {
      renderComponent: "select",
      options: [
        { value: false, label: "Production Mode" },
        { value: true, label: "Testing-Sandbox Mode" }],
      label: undefined
    }
  };

  const shopId = Reaction.getShopId();
  const packageSub = Meteor.subscribe("Packages", shopId);
  if (packageSub.ready()) {
    const packageData = Reaction.getPackageSettings("taxes-avalara");
    onData(null,
      {
        settings: packageData.settings,
        shownFields,
        hiddenFields,
        fieldsProp
      });
  }
};

registerComponent("AvalaraSettingsForm", AvalaraSettingsForm, [
  withProps(handlers), composeWithTracker(composer)
]);

export default compose(withProps(handlers), composeWithTracker(composer))(AvalaraSettingsForm);