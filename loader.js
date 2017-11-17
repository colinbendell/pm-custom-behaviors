function getBehaviorSrc(name, path, description = "") {
	return fetch(path)
	.then(response => response.text())
	.then(xml => {return {
		"description":description || name, // work around LUNA bug that both requires description but cannot be empty
		"name":name,
		"sharingLevel": "ACCOUNT",
		"xml": xml.trim(),
		"approvedByUser": "ftl"
	}});
}

function createBehavior(name, path, asCustomOverride = false) {
	return getBehaviorSrc(name, path)
        .then(behaviorSrc => {
            let apiPrefix = asCustomOverride ? "custom-overrides" : "custom-behaviors";
            return fetch(`https://control.akamai.com/papi/v0/${apiPrefix}`,
            {
                method: 'POST',
                credentials: "same-origin",
                body: JSON.stringify(behaviorSrc),
                headers: new Headers({"Content-Type": "application/json",
                    "PAPI-Use-Prefixes": "false"})
            })
    	});
}

function deleteBehavior(behavior, asCustomOverride = false) {
    let apiPrefix = asCustomOverride ? "custom-overrides" : "custom-behaviors";

    return fetch(`https://control.akamai.com/papi/v0/${apiPrefix}/${behavior.behaviorId}`,
        {
            method: 'DELETE',
            credentials: "same-origin",
            headers: new Headers({"PAPI-Use-Prefixes": "false"})
        })
}

function excludeExistingBehaviors(behaviors, asCustomOverride = false) {
    let apiPrefix = asCustomOverride ? "custom-overrides" : "custom-behaviors";

    return fetch(`https://control.akamai.com/papi/v0/${apiPrefix}`, {credentials: "same-origin"})
        .then(response => response.json())
        .then(data => {
            for (const existingBehavior of (data.customBehaviors || data.customOverrides).items) {
                behaviors.delete(existingBehavior.name);
            }
            return behaviors;
        })
}

function matchExistingBehaviors(behaviors, asCustomOverride = false) {
    let apiPrefix = asCustomOverride ? "custom-overrides" : "custom-behaviors";

    return fetch(`https://control.akamai.com/papi/v0/${apiPrefix}`, {credentials: "same-origin"})
        .then(response => response.json())
        .then(data => {
            let existingBehaviors = [];
            for (const existingBehavior of (data.customBehaviors || data.customOverrides).items) {
                if (behaviors.has(existingBehavior.name))
                    existingBehaviors.push(existingBehavior);
            }
            return existingBehaviors;
        })
}

function createAllCustomBehaviors(asCustomOverride = false) {
    let apiPrefix = asCustomOverride ? "/overrides" : "";

    return fetch(`https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents${apiPrefix}`)
        .then(response => response.json())
        .then(data => {
            let behaviorList = new Map();
            data.forEach(behaviorFile => {
                if (/\.xml$/.test(behaviorFile.name) && behaviorFile.size > 0)
                    behaviorList.set(behaviorFile.name.replace('.xml', ''), behaviorFile.download_url)
            });
            return behaviorList;
        })
        .then(behaviors => excludeExistingBehaviors(behaviors, asCustomOverride))
        .then(behaviors => Promise.all([...behaviors].map(val => {createBehavior(val[0], val[1], asCustomOverride)})));
}

function deleteAllCustomBehaviors(asCustomOverride = false) {
    let apiPrefix = asCustomOverride ? "/overrides" : "";

    return fetch(`https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents${apiPrefix}/deprecated`)
        .then(response => response.json())
        .then(data => {
            let behaviorSet = new Set();

            data.forEach(behaviorFile => {
                if (/\.xml$/.test(behaviorFile.name))
                    behaviorSet.add(behaviorFile.name.replace('.xml', ''))
            });
            return behaviorSet;
        })
        .then(behaviors => matchExistingBehaviors(behaviors, asCustomOverride))
        .then(behaviors => Promise.all(behaviors.map(o => {deleteBehavior(o, asCustomOverride)})));
}

function main() {
    createAllCustomBehaviors();
    deleteAllCustomBehaviors();
    createAllCustomBehaviors(true);
    deleteAllCustomBehaviors(true);
}

main();

