const TestResult = require('./TestResult.js');

/**
 * purpose is to extract the trigger id from within the triggerUri. It attempts to scrub based on their own path / rest uri. It will check against http and https.
 * @param {String} uri
 * @return {String}
 */
const getTriggerId = (uri) => {
  const basePath = 'api.runscope.com/radar/';
  const triggerAction = '/trigger';

  if (uri === null || uri === undefined) {
    return '';
  }

  const schemaAndId = uri.toLowerCase().indexOf(basePath) !== -1 &&
  uri.toLowerCase().indexOf(triggerAction) !== -1
    ? uri.toLowerCase().replace(basePath, '').replace(triggerAction, '')
    : '';

  if (schemaAndId === '') {
    return '';
  }

  return schemaAndId.replace('https://', '').replace('http://', '');
};

module.exports = class TestInfo {
  /**
   *
   * @param {String} [name] name of the test
   * @param {String} [id] id of the test
   * @param {String} [schedules] an array of schedules for this tests
   * @param {String} [success]
   * @param {String} [uri] the runscope
   * @param {String} [defaultEnvironmentId]
   * @param {String} [triggerUri] for telling runscope, 'hey, run this test!'
   */
  constructor (name, id, schedules, success, uri, defaultEnvironmentId, triggerUri) {
    this.name = name || '';
    this.results = [];
    this.id = id || '';
    this.schedules = schedules || [];
    this.success = success || '';
    this.uri = uri || '';
    this.defaultEnvironmentId = defaultEnvironmentId || '';
    this.triggerUri = triggerUri || '';
    this.triggerId = getTriggerId(this.triggerUri);
  }

  getHasSchedules () {
    return !(this.schedules === undefined || this.schedules === null || this.schedules.length === 0);
  }

  getResultsByDescTick () {
    if (this.results === undefined || this.results === null || this.results.length === 0) {
      return [];
    }

    const ascSort = (a, b) => {
      return a.runTick < b.runTick;
    };

    return this.results.sort(ascSort);
  }

  getMostPreviousResult () {
    const results = this.getResultsByDescTick();

    if (results.length <= 1) {
      return new TestResult();
    }

    return results[1];
  }

  getLatestResult () {
    const results = this.getResultsByDescTick();

    if (results.length === 0) {
      return new TestResult();
    }

    return results[0];
  }
}
;
