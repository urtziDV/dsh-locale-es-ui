//#region host half
/**
 * Node half of the Spanish language pack. Every contribution lives in the browser
 * half (`lib/client.js`); this entry exists so the package holds an ordinary Loader
 * row, which is what `dsh-client-modules` scans to serve the browser bundle.
 * @module dsh-locale-es-ui
 */
/** Loader-visible no-op body; the browser half carries the feature. */
function apply() {}
//#endregion
export { apply };
