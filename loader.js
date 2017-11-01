function getCustomBehaviorSrc(name, path, description = "") {
	return fetch(path)
	.then(response => response.text())
	.then(xml => {return {
		"description":description || name, // work around LUNA bug that both requires description but cannot be empty
		"name":name,
		"sharingLevel": "ACCOUNT",
		"xml": xml,
		"approvedByUser": "ftl"
	}});
}

function createCustomBehavior(name, path) {
	return getCustomBehaviorSrc(name, path)
        .then(behaviorSrc => {
            return fetch(`https://control.akamai.com/papi/v0/custom-behaviors`,
            {
                method: 'POST',
                credentials: "same-origin",
                body: JSON.stringify(behaviorSrc),
                headers: new Headers({"Content-Type": "application/json",
                    "PAPI-Use-Prefixes": "false"})
            })
    	});
}

function filterExistingBehaviors(behaviors) {
    return fetch(`https://control.akamai.com/papi/v0/custom-behaviors`, {credentials: "same-origin"})
        .then(response => response.json())
        .then(data => {
            for (const existingBehavior of data.customBehaviors.items) {
                behaviors.delete(existingBehavior.name);
            }
            return behaviors;
        })
}

function main() {
    return fetch(`https://api.github.com/repos/colinbendell/pm-custom-behaviors/contents/`)
        .then(response => response.json())
        .then(data => {
            let behaviorList = new Map();
            data.forEach(behaviorFile => {
                if (/\.xml$/.test(behaviorFile.name) && behaviorFile.size > 0)
                    behaviorList.set(behaviorFile.name.replace('.xml', ''), behaviorFile.download_url)
            });
            return behaviorList;
        })
        .then(behaviors => filterExistingBehaviors(behaviors))
        .then(behaviors => Promise.all([...behaviors].map(val => {createCustomBehavior(val[0], val[1])})));
}

main();

