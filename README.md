# Akamai Custom Behaviors for Property Manager

Akamai's configuration platform is called Property Manager. This allows you to manipulate both the logic state to fullfill requests and provide caching instructions. Often the rule/match/behavior meta structure is insufficient to accomplish tasks and Professional Services will introduce "Advanced Metatadata" or xml that manipulates the gHost platform. Unforunately this limits your ability to interact with the configuration by API. With Custom Behaviors, you can move these advanced metadata snippets into modules that are now mobile.

This repository is a collection of advanced metadata snippets that are commonly used.

# Installation
Please Akamai's official documented process for [adding customer behaviors and limitations](https://community.akamai.com/docs/DOC-9476)

# Convenience Loader (for faster installation)

For convenience, a helper loader is avaialble to expedite the creation of these behaviors. Only a person from Akamai PS, with elevated permission
can run this loader. To do so, they will need to first log into Luna, and switch contexts to your account. 

## Automatic sync
in the Chrome developer tools run:
```js
fetch("https://raw.githubusercontent.com/colinbendell/pm-custom-behaviors/master/loader.js").then(response=>response.text()).then(body => {eval(body)});
sync();
```

This will add (and deprecate) all behaviors in the repo. 

## Manual sync

Alternatively, to run individually/selectively you can use the `addBehavior` and `deleteBehavior` functions.
1. Load the script: `fetch("https://raw.githubusercontent.com/colinbendell/pm-custom-behaviors/master/loader.js").then(response=>response.text()).then(body => {eval(body)});`
2. add or delete: `addBehavior('my_custom_behavior_v3')` OR `deleteBehavior('my_custom_behavior_v2')`

> After the initial loader eval, the console will emit '//TODO: addBehavior(..)' indicating which actions are pending