import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { InternalCustomerlySettings } from "../typings/customerly-settings";

/**
 * Serializes a value for safe embedding inside an inline `<script>` tag.
 * `JSON.stringify` does not escape `</script>`, so a host-supplied setting value
 * (name, email, attributes, company name…) could otherwise break out of the
 * script element and inject arbitrary markup/JS. Escaping every `<` as `<`
 * keeps the payload inert to the HTML parser while remaining valid JS/JSON — all
 * `<` characters in JSON output occur inside quoted string literals.
 */
const embedJsonForScript = (data: unknown): string => JSON.stringify(data).split("<").join("\\u003c");

export const createHTML = async (settings: InternalCustomerlySettings) => {
  const os = Platform.OS;
  const app_name = DeviceInfo.getApplicationName();
  const app_version = DeviceInfo.getVersion();
  const device =
    os === "ios"
      ? `${await DeviceInfo.getManufacturer()} ${DeviceInfo.getModel()}`
      : `${await DeviceInfo.getManufacturer()} ${DeviceInfo.getModel()} (${await DeviceInfo.getDevice()})`;
  const os_version = DeviceInfo.getSystemVersion();

  const finalSettings = {
    ...settings,
    sdkMode: true,
    disableAutofocus: true,
    device: { os, app_name, app_version, device, os_version },
  };

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- The messenger renders as a position:fixed full-viewport layer and never needs this
         document to scroll. overflow:hidden is the rule that matters: any scrollable slack is
         room WebKit uses to displace the whole page when the keyboard opens. -->
    <style>html,body{margin:0;padding:0;height:100%;overflow:hidden;}</style>
  </head>
  <body>
    <script>
      !function(){var e=window,i=document,t="customerly",n="queue",o="load",r="settings",u=e[t]=e[t]||[];if(u.t){return void u.i("[customerly] SDK already initialized. Snippet included twice.")}u.t=!0;u.loaded=!1;u.o=["event","attribute","update","show","hide","open","close"];u[n]=[];u.i=function(t){e.console&&!u.debug&&console.error&&console.error(t)};u.u=function(e){return function(){var t=Array.prototype.slice.call(arguments);return t.unshift(e),u[n].push(t),u}};u[o]=function(t){u[r]=t||{};if(u.loaded){return void u.i("[customerly] SDK already loaded. Use \`customerly.update\` to change settings.")}u.loaded=!0;var e=i.createElement("script");e.type="text/javascript",e.async=!0,e.src="https://messenger.customerly.io/launcher.js";var n=i.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};u.o.forEach(function(t){u[t]=u.u(t)})}();

      // Register callbacks
      customerly.onMessengerInitialized = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onMessengerInitialized"}));
      };

      customerly.onChatClosed = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onChatClosed"}));
      };

      customerly.onChatOpened = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onChatOpened"}));
      };

      customerly.onHelpCenterArticleOpened = function(article) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onHelpCenterArticleOpened",
          data: article
        }));
      };

      customerly.onLeadGenerated = function(email) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onLeadGenerated",
          data: {email}
        }));
      };

      customerly.onMessageRead = function(conversationId, conversationMessageId) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onMessageRead",
          data: {conversationId, conversationMessageId}
        }));
      };

      customerly.onNewConversation = function(message, attachments) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onNewConversation",
          data: {message, attachments}
        }));
      };

      customerly.onNewMessageReceived = function(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onNewMessageReceived",
          data: message
        }));
      };

      customerly.onNewConversationReceived = function(conversationId) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onNewConversationReceived",
          data: {conversationId}
        }));
      };

      customerly.onProfilingQuestionAnswered = function(attribute, value) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onProfilingQuestionAnswered",
          data: {attribute, value}
        }));
      };

      customerly.onProfilingQuestionAsked = function(attribute) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onProfilingQuestionAsked",
          data: {attribute}
        }));
      };

      customerly.onRealtimeVideoAnswered = function(call) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onRealtimeVideoAnswered",
          data: call
        }));
      };

      customerly.onRealtimeVideoCanceled = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onRealtimeVideoCanceled"}));
      };

      customerly.onRealtimeVideoReceived = function(call) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onRealtimeVideoReceived", data: call}));
      };

      customerly.onRealtimeVideoRejected = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onRealtimeVideoRejected"}));
      };

      customerly.onSurveyAnswered = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onSurveyAnswered"}));
      };

      customerly.onSurveyPresented = function(survey) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onSurveyPresented", data: survey}));
      };

      customerly.onSurveyRejected = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: "onSurveyRejected"}));
      };

      // Load Customerly Messenger
      customerly.load(${embedJsonForScript(finalSettings)});
    </script>
  </body>
</html>
`;
};
