import { InternalCustomerlySettings } from "../typings/customerly-settings";

export const createHTML = (settings: InternalCustomerlySettings) => {
  const finalSettings = { ...settings, sdkMode: true, disableAutofocus: true };

  return `
<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
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
          data: {email: email}
        }));
      };
      
      customerly.onNewConversation = function(message, attachments) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onNewConversation",
          data: {message: message, attachments: attachments}
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
          data: {conversationId: conversationId}
        }));
      };
      
      customerly.onProfilingQuestionAnswered = function(attribute, value) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onProfilingQuestionAnswered",
          data: {attribute: attribute, value: value}
        }));
      };
      
      customerly.onProfilingQuestionAsked = function(attribute) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "onProfilingQuestionAsked",
          data: {attribute: attribute}
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
      customerly.load(${JSON.stringify(finalSettings)});
    </script>
  </body>
</html>
`;
};
