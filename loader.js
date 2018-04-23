function _getBehaviorSrc(name, path, description = "") {
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

function _addBehavior(name, path, isCustomOverride = false, dryrun = false) {
    console.log(`${dryrun? "// TODO: " : ""}addBehavior("${name}");`);
    return _getBehaviorSrc(name, path)
        .then(behaviorSrc => {
            if (dryrun) return true;

            let apiPrefix = isCustomOverride ? "custom-overrides" : "custom-behaviors";
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

function _deleteBehavior(behavior, isCustomOverride = false, dryrun = false) {
    console.log(`${dryrun? "// TODO: " : ""}deleteBehavior("${behavior.name}");`);
    if (dryrun) return true;

    let apiPrefix = isCustomOverride ? "custom-overrides" : "custom-behaviors";
    return fetch(`https://control.akamai.com/papi/v0/${apiPrefix}/${behavior.behaviorId}`,
        {
            method: 'DELETE',
            credentials: "same-origin",
            headers: new Headers({"PAPI-Use-Prefixes": "false"})
        })
}

function excludeExistingBehaviors(behaviors, isCustomOverride = false) {
    let apiPrefix = isCustomOverride ? "custom-overrides" : "custom-behaviors";

    return fetch(`https://control.akamai.com/papi/v0/${apiPrefix}`, {credentials: "same-origin"})
        .then(response => response.json())
        .then(data => {
            for (const existingBehavior of (data.customBehaviors || data.customOverrides).items) {
                behaviors.delete(existingBehavior.name);
            }
            return behaviors;
        })
}

function _matchExistingBehaviors(behaviors, isCustomOverride = false) {
    let apiPrefix = isCustomOverride ? "custom-overrides" : "custom-behaviors";

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

function _addAllCustomBehaviors(dryrun = false, filter = null) {
    return Promise.all([true, false].map(isCustomOverride => 
        fetch(`https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents${isCustomOverride ? "/overrides" : ""}`)
            .then(response => response.status !== 200 ? Promise.reject(response) : response.json())
            .then(data => {
                let behaviorList = new Map();
                data.forEach(behaviorFile => {
                    if (/\.xml$/.test(behaviorFile.name)
                        && (!filter || new RegExp(filter).test(behaviorFile.name))
                        && behaviorFile.size > 0)
                        behaviorList.set(behaviorFile.name.replace('.xml', ''), behaviorFile.download_url)
                });
                return behaviorList;
            })
            .then(behaviors => excludeExistingBehaviors(behaviors, isCustomOverride))
            .then(behaviors => Promise.all([...behaviors].map(val => {_addBehavior(val[0], val[1], isCustomOverride, dryrun)})))
        )
    );
}

function _deleteAllCustomBehaviors(dryrun = false, filter = null) {
    return Promise.all([true, false].map(isCustomOverride =>
        fetch(`https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents${isCustomOverride ? "/overrides" : ""}/deprecated`)
            .then(response => response.status !== 200 ? Promise.reject(response) : response.json())
            .then(data => {
                let behaviorSet = new Set();

                data.forEach(behaviorFile => {
                    if (/\.xml$/.test(behaviorFile.name)
                        && (!filter || new RegExp(filter).test(behaviorFile.name)))
                        behaviorSet.add(behaviorFile.name.replace('.xml', ''))
                });
                return behaviorSet;
            })
            .then(behaviors => _matchExistingBehaviors(behaviors, isCustomOverride))
            .then(behaviors => Promise.all(behaviors.map(o => {_deleteBehavior(o, isCustomOverride, dryrun)})))
        )
    );
}

function sync(dryrun = false) {
    return _addAllCustomBehaviors(dryrun)
        .then (() => _deleteAllCustomBehaviors(dryrun))
        .then(() => dryrun ? console.log('//TODO: run `sync();` to automatically perform the above') : '')
        .catch(e => console.error(e))
}

function addBehavior(name) {
    return _addAllCustomBehaviors(false, name);
}

function deleteBehavior(name) {
    return _deleteAllCustomBehaviors(false, name);
}

sync(true);

