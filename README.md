# Akamai Custom Behaviors for Property Manager

Akamai's configuration platform is called Property Manager. This allows you to manipulate both the logic state to fullfill requests and provide caching instructions. Often the rule/match/behavior meta structure is insufficient to accomplish tasks and Professional Services will introduce "Advanced Metatadata" or xml that manipulates the gHost platform. Unforunately this limits your ability to interact with the configuration by API. With Custom Behaviors, you can move these advanced metadata snippets into modules that are now mobile.

This repository is a collection of advanced metadata snippets that are commonly used.

#Use
1. Have a person from PS or AkaTec log into Luna (`control.akamai.com`)
2. switch 'contexts' to your account
3. Have them execute this command: `fetch("https://raw.githubusercontent.com/colinbendell/pm-custom-behaviors/master/loader.js").then(response=>response.text()).then(body => {eval(body)});`

After this you will be able to reference these custom behaviors in your config.
