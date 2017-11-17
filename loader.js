function getCustomBehaviorSrc(name, path, description = "") {
	return fetch(path)
	.then(response => response.text())
	.then(xml => {return {
		"description":description || name, // work around LUNA bug that both requires description but cannot be empty
		"name":name,
		"sharingLevel": "ACCOUNT",
		"xml": xml.trim().replace(/\n|\r/g, ""),
		"approvedByUser": "ftl"
	}});
}

function createCustomBehavior(name, path, isCustomOverride = false) {
	return getCustomBehaviorSrc(name, path)
        .then(behaviorSrc => {
            let url = `https://control.akamai.com/papi/v0/custom-behaviors`;
            if (isCustomOverride) url = `https://control.akamai.com/papi/v0/custom-overrides`;
            return fetch(url,
            {
                method: 'POST',
                credentials: "same-origin",
                body: JSON.stringify(behaviorSrc),
                headers: new Headers({"Content-Type": "application/json",
                    "PAPI-Use-Prefixes": "false"})
            })
    	});
}

function deleteCustomBehavior(behavior, isCustomOverride = false) {
    let url = `https://control.akamai.com/papi/v0/custom-behaviors/${behavior.behaviorId}`;
    if (isCustomOverride) url = `https://control.akamai.com/papi/v0/custom-overrides/${behavior.behaviorId}`;

    return fetch(url,
        {
            method: 'DELETE',
            credentials: "same-origin",
            headers: new Headers({"Content-Type": "application/json",
                "PAPI-Use-Prefixes": "false"})
        })
}

function excludeExistingBehaviors(behaviors, isCustomOverride = false) {
    let url = `https://control.akamai.com/papi/v0/custom-behaviors`;
    if (isCustomOverride) url = `https://control.akamai.com/papi/v0/custom-overrides`;
    return fetch(url, {credentials: "same-origin"})
        .then(response => response.json())
        .then(data => {
            for (const existingBehavior of data.customBehaviors.items) {
                behaviors.delete(existingBehavior.name);
            }
            return behaviors;
        })
}

function matchExistingBehaviors(behaviors, isCustomOverride = false) {
    let url = `https://control.akamai.com/papi/v0/custom-behaviors`;
    if (isCustomOverride) url = `https://control.akamai.com/papi/v0/custom-overrides`;
    return fetch(url, {credentials: "same-origin"})
        .then(response => response.json())
        .then(data => {
            let existingBehaviors = [];
            for (const existingBehavior of data.customBehaviors.items) {
                if (behaviors.has(existingBehavior.name))
                    existingBehaviors.push(existingBehavior);
            }
            return existingBehaviors;
        })
}

function createAllCustomBehaviors(isCustomOverride = false) {
    let url = `https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents`;
    if (isCustomOverride) url = `https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents/overrides`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            let behaviorList = new Map();
            data.forEach(behaviorFile => {
                if (/\.xml$/.test(behaviorFile.name) && behaviorFile.size > 0)
                    behaviorList.set(behaviorFile.name.replace('.xml', ''), behaviorFile.download_url)
            });
            return behaviorList;
        })
        .then(behaviors => excludeExistingBehaviors(behaviors, isCustomOverride))
        .then(behaviors => Promise.all([...behaviors].map(val => {createCustomBehavior(val[0], val[1], isCustomOverride)})));
}

function deleteAllCustomBehaviors(isCustomOverride = false) {
    let url = `https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents/deprecated`;
    if (isCustomOverride) url = `https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents/overrides/deprecated`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            let behaviorSet = new Set();

            data.forEach(behaviorFile => {
                if (/\.xml$/.test(behaviorFile.name) && behaviorFile.size > 0)
                    behaviorSet.set(behaviorFile.name.replace('.xml', ''), behaviorFile.download_url)
            });
            return behaviorSet;
        })
        .then(behaviors => matchExistingBehaviors(behaviors, isCustomOverride))
        .then(behaviors => Promise.all(behaviors.map(o => {deleteCustomBehavior(o, isCustomOverride)})));
}

function main() {
    createAllCustomBehaviors();
    deleteAllCustomBehaviors();
    createAllCustomOverrides(true);
    deleteAllCustomBehaviors(true);
}

main();

