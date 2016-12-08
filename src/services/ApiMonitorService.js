const Promise = require('bluebird');

const TestInfo = require('./../models/TestInfo.js');
const TestResult = require('./../models/TestResult.js');
const BucketInfo = require('./../models/BucketInfo.js');
const TestResultCollection = require('./../models/TestResultCollection.js');
const TestResultTimeFrame = require('./../models/TestResultTimeFrame.js');
const SuccessTypes = require('./../models/SuccessTypes.js');
const util = require('util');

const RunscopeWrapperService = require('./RunscopeWrapperService');

const service = new RunscopeWrapperService();

const isStringNullUndefinedOrEmpty = value => {
  return util.isNullOrUndefined(value) || value === '';
};

const isArrayNullUndefinedOrEmpty = value => {
  return util.isNullOrUndefined(value) || value.length === 0;
};

const transformTheRuns = collection => {
  const result = [];

  if (collection.length === 0) {
    return result;
  }

  for (let i = 0; i < collection.length; i++) {
    result.push({
      bucketId: collection[i].bucket_key,
      testId: collection[i].test_id,
    });
  }

  return result;
};

const findByName = (dataArray, bucketName) => {
  if (isArrayNullUndefinedOrEmpty(dataArray) ||
    isStringNullUndefinedOrEmpty(bucketName)) {
    return null;
  }

  return dataArray.find(entity => {
    return entity.name.toLowerCase() === bucketName.toLowerCase();
  });
};

const convertToTestInfo = (bucketId, testData) => {
  const testInfo = new TestInfo(
    testData.name,
    testData.id,
    testData.schedules,
    SuccessTypes.notRun,
    service.getTestResultsInBucketPageUri(bucketId, testData.id),
    testData.default_environment_id,
    testData.trigger_url
  );

  return testInfo;
};

const convertToTestResult = (testResultData) => {
  const testResult = new TestResult();
  testResult.testId = testResultData.test_id;
  testResult.testResultId = testResultData.test_run_id;
  testResult.success = testResultData.result;
  testResult.runTick = testResultData.started_at;

  return testResult;
};

const convertToTestResultCollection = (testResultDataCollection) => {
  const collection = [];

  if (isArrayNullUndefinedOrEmpty(testResultDataCollection)) {
    return collection;
  }

  for (let i = 0; i < testResultDataCollection.length; i++) {
    collection.push(convertToTestResult(testResultDataCollection[i]));
  }

  return collection;
};

const convertToTestInfoCollection = (bucketId, testsDataCollection) => {
  const collection = [];

  if (isArrayNullUndefinedOrEmpty(testsDataCollection)) {
    return collection;
  }

  for (let i = 0; i < testsDataCollection.length; i++) {
    collection.push(convertToTestInfo(bucketId, testsDataCollection[i]));
  }

  return collection;
};

class ApiMonitorService {

  /**
   *
   * @param {string} token
   * @return {Promise<Array<BucketInfo>>}
   */
  getBuckets(token) {
    if (isStringNullUndefinedOrEmpty(token)) {
      return Promise.reject(new Error('token is invalid. Please make sure it is populated with a string.'));
    }

    return service.getBuckets(token)
      .then(response => {
        const data = JSON.parse(response.body).data;

        const collection = [];
        for (let i = 0; i < data.length; i++) {
          collection.push(new BucketInfo(
            data[i].name,
            data[i].key,
            service.getBucketPageUri(data[i].key),
            data[i].default_environment_id));
        }

        return Promise.resolve(collection);
      }).catch(error => {
        return Promise.reject(error);
      });
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @returns {Promise<Array<TestInfo>>}
   */
  getBucketTestsLists(token, bucketId) {
    if (isStringNullUndefinedOrEmpty(token) ||
      isStringNullUndefinedOrEmpty(bucketId)) {
      return Promise.reject(new Error('token or bucketId is invalid. Please make sure these are populated with strings.'));
    }

    return service.getBucketTestsLists(token, bucketId)
      .then(response => {
        const data = JSON.parse(response.body).data;
        return Promise.resolve(convertToTestInfoCollection(bucketId, data));
      })
      .catch(error => Promise.reject(error));
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @param {string} testId
   * @returns {Promise<TestInfo>}
   */
  getTestInformationInBucket(token, bucketId, testId) {
    if (service === null ||
      isStringNullUndefinedOrEmpty(token) ||
      util.isNullOrUndefined(testId) ||
      isStringNullUndefinedOrEmpty(bucketId)) {
      return Promise.reject(new Error('token, bucketId, or testId is invalid. Please make sure these are populated with strings.'));
    }

    return service.getTestInformationInBucket(token, bucketId, testId)
      .then(response => {
        const data = JSON.parse(response.body).data;

        const testInfo = convertToTestInfo(bucketId, data);
        return Promise.resolve(testInfo);
      }).catch(error => Promise.reject(error));
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @param {string} testId
   * @returns {Promise<Array<TestResult>>}
   */
  getTestResultsForTestInBucket(token, bucketId, testId) {
    if (isStringNullUndefinedOrEmpty(token) ||
      util.isNullOrUndefined(testId) ||
      isStringNullUndefinedOrEmpty(bucketId)) {
      return Promise.reject(new Error('token, bucketId, or testId is invalid. Please make sure these are populated with strings.'));
    }

    return service.getTestResultsForTestInBucket(token, bucketId, testId)
      .then(response => {
        const dataTestResultCollection = JSON.parse(response.body).data;
        const testInfo = convertToTestResultCollection(dataTestResultCollection);
        return Promise.resolve(testInfo);
      })
      .catch(error => Promise.reject(error));
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @param {string} testId
   * @returns {Promise<TestResult>}
   */
  getLatestTestResultInBucket(token, bucketId, testId) {
    if (isStringNullUndefinedOrEmpty(token) ||
      util.isNullOrUndefined(testId) ||
      isStringNullUndefinedOrEmpty(bucketId)) {
      return Promise.reject(new Error('token, bucketId, or testId is invalid. Please make sure these are populated with strings.'));
    }

    const testResult = new TestResult();
    testResult.testId = testId;

    return service.getLatestTestResultsInBucket(token, bucketId, testId)
      .then(response => {
        const data = JSON.parse(response.body).data;
        testResult.success = data.result;

        return Promise.resolve(testResult);
      }).catch(() => {
        testResult.success = SuccessTypes.runscopeServerError;
        return Promise.resolve(testResult);
      });
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @param {Array<string>} dataIdsOnly
   * @returns {Promise<Array<Array<TestResult>>>}
   */
  getAllTestResultsForTestInBucketByTestIds(token, bucketId, dataIdsOnly) {
    const promises = [];

    if (isArrayNullUndefinedOrEmpty(dataIdsOnly)) {
      return Promise.resolve(promises);
    }

    for (let i = 0; i < dataIdsOnly.length; i++) {
      promises.push(this.getTestResultsForTestInBucket(token, bucketId, dataIdsOnly[i]));
    }

    return Promise.all(promises);
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @param {Array<string>} dataIdsOnly
   * @returns {Promise<Array<TestInfo>>}
   */
  getAllTestInformationInBucketByTestIds(token, bucketId, dataIdsOnly) {
    const promises = [];

    if (isArrayNullUndefinedOrEmpty(dataIdsOnly)) {
      return Promise.resolve(promises);
    }

    for (let i = 0; i < dataIdsOnly.length; i++) {
      promises.push(this.getTestInformationInBucket(token, bucketId, dataIdsOnly[i]));
    }

    return Promise.all(promises);
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @returns {Promise<Array<TestInfo>>}
   */
  getMostRecentResultsOfAllTestsInBucket(token, bucketId) {
    if (isStringNullUndefinedOrEmpty(token) ||
      isStringNullUndefinedOrEmpty(bucketId)) {
      return Promise.reject(new Error('token or bucketId is invalid. Please make sure these are populated with strings.'));
    }

    return this.getBucketTestsLists(token, bucketId)
      .then(testsInBucketCollection => {
        const dataIdsOnly = [];

        for (let d = 0; d < testsInBucketCollection.length; d++) {
          dataIdsOnly.push(testsInBucketCollection[d].id);
        }

        return this.getAllTestInformationInBucketByTestIds(token, bucketId, dataIdsOnly)
          .then(testInfoCollection => {
            return this.getAllTestResultsForTestInBucketByTestIds(token, bucketId, dataIdsOnly)
              .then(testDataResultsCollection => {
                for (let i = 0; i < testInfoCollection.length; i++) {
                  for (let w = 0; w < testDataResultsCollection.length; w++) {
                    const testResultCollectionGroup = testDataResultsCollection[w];
                    for (let ww = 0; ww < testResultCollectionGroup.length; ww++) {
                      if (testInfoCollection[i].id === testResultCollectionGroup[ww].testId) {
                        testInfoCollection[i].results.push(testResultCollectionGroup[ww]);
                      }
                    }
                  }
                }

                return Promise.resolve(testInfoCollection);
              }).catch(error => Promise.reject(error));
          }).catch(error => Promise.reject(error));
      });
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketName
   * @returns  {Promise<TestResultCollection>}
   */
  getMostRecentResultsOfAllTestsInBucketByName(token, bucketName) {
    if (isStringNullUndefinedOrEmpty(token) ||
      isStringNullUndefinedOrEmpty(bucketName)) {
      return Promise.reject(new Error('token or bucketName is invalid. Please make sure these are populated with strings.'));
    }

    return this.getBuckets(token).then(data => {
      const bucketInfo = findByName(data, bucketName);

      if (bucketInfo === null) {
        return Promise.reject(new Error(`cannot find a match for '${bucketName}'`));
      }

      return this.getMostRecentResultsOfAllTestsInBucket(token, bucketInfo.id)
        .then(testInfoCollection => {
          const resultForTestCollection = new TestResultCollection();
          resultForTestCollection.bucketInfo = bucketInfo;

          for (let i = 0; i < testInfoCollection.length; i++) {
            const testInfo = testInfoCollection[i];

            resultForTestCollection.testData.push(testInfo);
          }

          return Promise.resolve(resultForTestCollection);
        }).catch(error => Promise.reject(error));
    }).catch(error => Promise.reject(error));
  }

  /**
   *
   * @param {string} token
   * @param  {string} bucketName
   * @returns {Promise<TestResultCollection>}
   */
  getTimeFrameOfTestsInBucketByName(token, bucketName) {
    if (isStringNullUndefinedOrEmpty(token) ||
      isStringNullUndefinedOrEmpty(bucketName)) {
      return Promise.reject('token or bucketName is invalid. Please make sure these are populated with strings.');
    }

    return this.getMostRecentResultsOfAllTestsInBucketByName(token, bucketName)
      .then(testResultCollection => {
        const resultForTestCollection = new TestResultCollection();
        resultForTestCollection.bucketInfo = testResultCollection.bucketInfo;

        for (let i = 0; i < testResultCollection.testData.length; i++) {
          const testInfo = testResultCollection.testData[i];

          resultForTestCollection.testData.push(new TestResultTimeFrame(
            testInfo.name,
            testInfo.id,
            testInfo.getMostPreviousResult(),
            testInfo.getLatestResult(),
            testInfo.uri));
        }

        return Promise.resolve(resultForTestCollection);
      }).catch(error => Promise.reject(error));
  }

  /**
   *
   * @param {string} token
   * @param {string} bucketId
   * @return {Promise.<Array<Object>>}
   */
  getSharedEnvironments(token, bucketId) {
    return service.getSharedEnvironments(token, bucketId)
      .then(response => {
        const data = JSON.parse(response.body).data;

        if (isArrayNullUndefinedOrEmpty(data)) {
          return Promise.resolve(data);
        }

        const result = [];

        for (let i = 0; i < data.length; i++) {
          result.push({
            id: data[i].id,
            name: data[i].name
          });
        }

        return Promise.resolve(result);
      })
      .catch(error => Promise.reject(error));
  }

  /**
   * returns a run collection
   * @param {string} token
   * @param {string} triggerId
   * @param {string} environmentId
   */
  triggerById(token, triggerId, environmentId) {
    return service.triggerById(token, triggerId, environmentId)
      .then(response => {
        const bodyData = JSON.parse(response.body).data;

        if (isArrayNullUndefinedOrEmpty(bodyData.runs)) {
          return Promise.resolve(bodyData.runs);
        }

        return Promise.resolve(transformTheRuns(bodyData.runs));
      })
      .catch(error => Promise.reject(error));
  }

  /**
   * returns a run collection
   * @param {string} token
   * @param {TestInfo} testInfo
   * @param {string} environmentId
   */
  triggerByTestInformation(token, testInfo, environmentId) {
    return service.triggerByUri(token, testInfo.triggerUri, environmentId)
      .then(response => {
        const bodyData = JSON.parse(response.body).data;

        if (isArrayNullUndefinedOrEmpty(bodyData.runs)) {
          return Promise.resolve(bodyData.runs);
        }

        return Promise.resolve(transformTheRuns(bodyData.runs));
      })
      .catch(error => Promise.reject(error));
  }
}

module.exports = ApiMonitorService;
