const expect = require('chai').expect;
const uuid = require('uuidv4');
const mockery = require('mockery');
const sinon = require('sinon');
require('sinon-as-promised');

const TestInfo = require('../../../src/models/TestInfo.js');
const SuccessTypes = require('../../../src/models/SuccessTypes.js');

describe('ApiServiceMonitor', () => {
  let sandbox;
  let token;
  let bucketId;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    sandbox = sinon.sandbox.create();

    token = uuid();
    bucketId = uuid();
  });

  afterEach(() => {
    sandbox.restore();
    mockery.disable();
    mockery.deregisterAll();
    token = null;
    bucketId = null;
  });

  describe('and getting buckets', () => {
    it('when populated', () => {
      const bucketInfo = {name: uuid(), key: uuid(), default_environment_id: uuid()};
      const uri = '';

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getBuckets: sandbox.stub().resolves({
            body: JSON.stringify({data: [bucketInfo]})
          }),
          getBucketPageUri: sandbox.stub().returns(uri)
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      return apiMonitor.getBuckets(token)
        .then(data => {
          expect(data.length).to.be.greaterThan(0);
          expect(data[0].isNew()).to.equal(false);
          expect(data[0].name).to.equal(bucketInfo.name);
          expect(data[0].id).to.equal(bucketInfo.key);
          expect(data[0].defaultEnvironmentId).to.equal(bucketInfo.default_environment_id);
          expect(data[0].uri).to.equal(uri);
        });
    });
  });

  describe('and getting basic test info inside a bucket', () => {
    describe('and proper runscope trigger uri', () => {
      it('it should return the data result', () => {
        const triggerId = uuid();

        const testData = {
          name: uuid(),
          test_id: uuid(),
          schedules: [],
          default_environment_id: uuid(),
          trigger_url: `http://api.runscope.com/radar/${triggerId}/trigger`
        };

        const uri = 'url';

        const runscopeServiceMock = function RunscopeWrapperService() {
          return {
            getBucketTestsLists: sandbox.stub().resolves({
              body: JSON.stringify({
                data: [testData]
              })
            }),
            getTestResultsInBucketPageUri: sandbox.stub().returns(uri)
          };
        };

        mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

        const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
        const apiMonitor = new ApiMonitorService();

        return apiMonitor.getBucketTestsLists(token, bucketId)
          .then(testInfoCollection => {
            expect(testInfoCollection.length > 0).to.equal(true);

            expect(testInfoCollection[0].id).to.equal('');
            expect(testInfoCollection[0].name).to.equal(testData.name);
            expect(testInfoCollection[0].success).to.equal(SuccessTypes.notRun);
            expect(testInfoCollection[0].results).to.deep.equal([]);
            expect(testInfoCollection[0].uri).equal(uri);
            expect(testInfoCollection[0].defaultEnvironmentId).equal(testData.default_environment_id);
            expect(testInfoCollection[0].triggerUri).equal(testData.trigger_url);
            expect(testInfoCollection[0].triggerId).equal(triggerId);
          });
      });
    });
  });

  describe('and getting tests information', () => {
    it('it should get it ', () => {
      const testInfo = {
        id: uuid(),
        schedules: []
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestInformationInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [testInfo]})
          }),
          getTestResultsInBucketPageUri: sandbox.stub().returns('')
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const versionTestId = uuid();

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      return apiMonitor.getAllTestInformationInBucketByTestIds(token, bucketId, [versionTestId])
        .then(testInfoCollection => {
          expect(testInfoCollection.length > 0).to.equal(true);
          expect(testInfoCollection[0].id).to.equal('');
          expect(testInfoCollection[0].success).to.equal(SuccessTypes.notRun);
          expect(testInfoCollection[0].results).to.deep.equal([]);
          expect(testInfoCollection[0].uri).to.equal('');
        });
    });
  });

  describe('and getting tests results', () => {
    it('it should get it ', () => {
      const testResult = {
        test_id: uuid(),
        started_at: uuid(),
        result: uuid(),
        test_run_id: uuid()
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestResultsForTestInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [testResult]})
          }),
          getBucketPageUri: sandbox.stub().returns('')
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      const versionTestId = uuid();

      return apiMonitor.getAllTestResultsForTestInBucketByTestIds(token, bucketId, [versionTestId])
        .then((testResultsCollectionOfCollections) => {
          expect(testResultsCollectionOfCollections).to.not.be.null;

          expect(testResultsCollectionOfCollections.length > 0).to.equal(true);
          expect(testResultsCollectionOfCollections[0] instanceof Array).to.equal(true);
          expect(testResultsCollectionOfCollections[0][0].testId).to.equal(testResult.test_id);
          expect(testResultsCollectionOfCollections[0][0].runTick).to.equal(testResult.started_at);
          expect(testResultsCollectionOfCollections[0][0].testResultId).to.equal(testResult.test_run_id);
          expect(testResultsCollectionOfCollections[0][0].success).to.equal(testResult.result);
        });
    });
  });

  describe('and getting tests\' basic info inside a bucket', () => {
    it('when populated', () => {
      const dataItem = {
        test_id: uuid(),
        started_at: uuid(),
        result: uuid(),
        test_run_id: uuid()
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getLatestTestResultsInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: dataItem})
          }),
          getBucketPageUri: sandbox.stub().returns('')
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      const versionTestId = uuid();

      return apiMonitor.getLatestTestResultInBucket(token, bucketId, versionTestId)
        .then(actualTestResult => {
          expect(actualTestResult).to.not.be.null;
          expect(actualTestResult.testId).to.equal(versionTestId);
          expect(actualTestResult.runTick).to.equal(-1);
          expect(actualTestResult.testResultId).to.equal(-1);
          expect(actualTestResult.success).to.equal(dataItem.result);
        });
    });
  });

  describe('and getting all test information inside a bucket', () => {
    it('when populated', () => {
      const versionTestId = uuid();

      const info = {
        name: uuid(),
        id: versionTestId,
        schedules: []
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestInformationInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: info})
          }),
          getTestResultsInBucketPageUri: sandbox.stub().returns('')
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      return apiMonitor.getTestInformationInBucket(token, bucketId, versionTestId)
        .then(actualTestInfo => {
          expect(actualTestInfo.success).to.equal(SuccessTypes.notRun);
          expect(actualTestInfo.results).to.deep.equal([]);
          expect(actualTestInfo.uri).to.equal('');
          expect(actualTestInfo.id).to.equal(versionTestId);
          expect(actualTestInfo.name).to.equal(info.name);
        });
    });
  });

  describe('and getting all test results inside a bucket', () => {
    it('when populated', () => {
      const versionTestId = uuid();
      const dataItem = {
        test_id: versionTestId,
        started_at: uuid()
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestResultsForTestInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [dataItem]})
          }),
          getBucketPageUri: sandbox.stub().returns('')
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();
      return apiMonitor.getTestResultsForTestInBucket(token, bucketId, versionTestId)
        .then(actualTestResultCollection => {
          expect(actualTestResultCollection instanceof Array).to.equal(true);
          expect(actualTestResultCollection[0].testId).to.equal(versionTestId);
          expect(actualTestResultCollection[0].runTick).to.equal(dataItem.started_at);
          expect(actualTestResultCollection[0].testResultId).to.equal(dataItem.result);
          expect(actualTestResultCollection[0].success).to.equal(dataItem.result);
        });
    });
  });

  describe('and getting all test results inside a bucket', () => {
    it('it should get them', () => {
      const versionTestId = uuid();

      const info = {
        name: uuid(),
        id: versionTestId,
        schedules: []
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestResultsInBucketPageUri: sandbox.stub().returns(''),
          getBucketTestsLists: sandbox.stub().resolves({
            body: JSON.stringify({
              data: [{
                name: uuid(),
                id: uuid(),
                schedules: []
              }]
            })
          }),
          getTestInformationInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: info})
          }),
          getTestResultsForTestInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [info]})
          })
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();
      return apiMonitor.getMostRecentResultsOfAllTestsInBucket(token, bucketId)
        .then(actualTestInfoCollection => {
          expect(actualTestInfoCollection.length > 0).to.equal(true);
          expect(actualTestInfoCollection[0].id).to.not.be.null;
          expect(actualTestInfoCollection[0].name).to.not.be.null;
          expect(actualTestInfoCollection[0].success).to.not.be.null;
          expect(actualTestInfoCollection[0].results).to.not.be.null;
          expect(actualTestInfoCollection[0].uri).to.not.be.null;
        });
    });
  });

  describe('and getting all test results inside a bucket by name', () => {
    it('when populated', () => {
      const bucketItem = {
        name: `bucket name ${uuid()}`,
        key: `key${uuid()}`
      };

      const info = {
        name: `test name ${uuid()}`,
        id: bucketItem.key,
        schedules: []
      };

      const testList = {
        name: info.name,
        id: info.id,
        schedules: []
      };

      const recentTestResults = {
        id: uuid(),
        test_id: info.id
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestResultsInBucketPageUri: sandbox.stub().returns(''),
          getBuckets: sandbox.stub().resolves({
            body: JSON.stringify({data: [bucketItem]})
          }),
          getBucketTestsLists: sandbox.stub().resolves({
            body: JSON.stringify({
              data: [testList]
            })
          }),
          getTestInformationInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: info})
          }),
          getBucketPageUri: sandbox.stub().returns(''),
          getMostRecentResultsOfAllTestsInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [recentTestResults]})
          }),
          getTestResultsForTestInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [info]})
          })
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      return apiMonitor.getMostRecentResultsOfAllTestsInBucketByName(token, bucketItem.name)
        .then(actualTestResultCollection => {
          expect(actualTestResultCollection.bucketInfo.name).to.equal(bucketItem.name);
          expect(actualTestResultCollection.bucketInfo.id).to.equal(bucketItem.key);
          expect(actualTestResultCollection.bucketInfo.uri).to.equal('');

          expect(actualTestResultCollection.testData.length > 0).to.equal(true);

          expect(actualTestResultCollection.testData[0].id).to.equal(bucketItem.key);
          expect(actualTestResultCollection.testData[0].name).to.equal(info.name);
          expect(actualTestResultCollection.testData[0].success).to.equal(SuccessTypes.notRun);
          expect(actualTestResultCollection.testData[0].results).to.deep.equal([]);
          expect(actualTestResultCollection.testData[0].uri).to.equal('');
        });
    });
  });

  describe('and getting all test results inside a bucket by name', () => {
    it('when populated', () => {
      const bucketItem = {
        name: `bucket name ${uuid()}`,
        key: `key${uuid()}`
      };

      const info = {
        name: `test name ${uuid()}`,
        id: bucketItem.key,
        schedules: []
      };

      const testList = {
        name: info.name,
        id: info.id,
        schedules: []
      };

      const recentTestResults = {
        id: uuid(),
        test_id: info.id
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getTestResultsInBucketPageUri: sandbox.stub().returns(''),
          getBuckets: sandbox.stub().resolves({
            body: JSON.stringify({data: [bucketItem]})
          }),
          getBucketTestsLists: sandbox.stub().resolves({
            body: JSON.stringify({
              data: [testList]
            })
          }),
          getTestInformationInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: info})
          }),
          getBucketPageUri: sandbox.stub().returns(''),
          getMostRecentResultsOfAllTestsInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [recentTestResults]})
          }),
          getTestResultsForTestInBucket: sandbox.stub().resolves({
            body: JSON.stringify({data: [info]})
          })
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      return apiMonitor.getTimeFrameOfTestsInBucketByName(token, bucketItem.name)
        .then(actualTestResultCollection => {
          expect(actualTestResultCollection.bucketInfo.name).to.equal(bucketItem.name);
          expect(actualTestResultCollection.bucketInfo.id).to.equal(bucketItem.key);
          expect(actualTestResultCollection.bucketInfo.uri).to.equal('');

          expect(actualTestResultCollection.testData.length > 0).to.equal(true);

          expect(actualTestResultCollection.testData instanceof Array).to.equal(true);
          expect(actualTestResultCollection.testData[0].id).to.equal(bucketItem.key);
          expect(actualTestResultCollection.testData[0].name).to.equal(info.name);
          expect(actualTestResultCollection.testData[0].previousTestResult).to.deep.equal({
            testId: -1,
            runTick: -1,
            testResultId: -1,
            success: SuccessTypes.notRun
          });

          expect(actualTestResultCollection.testData[0].uri).to.equal('');
        });
    });
  });

  describe('and getting environments', () => {
    it('should call', () => {
      const environment = {
        name: uuid(),
        id: uuid()
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          getSharedEnvironments: sandbox.stub().resolves({
            body: JSON.stringify({data: [environment]})
          })
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');

      const apiMonitor = new ApiMonitorService();

      return apiMonitor.getSharedEnvironments(token, bucketId)
        .then(results => {
          console.log(results);
          expect(results[0]).to.deep.equal(environment);
        });
    });
  });

  describe('and trigger by id', () => {
    it('should call', () => {
      const runItem = {
        bucket_key: uuid(),
        test_id: uuid()
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          triggerById: sandbox.stub().resolves({
            body: JSON.stringify({data: {runs: [runItem]}})
          })
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      return apiMonitor.triggerById(uuid(), uuid(), uuid())
        .then(runCollection => {
          expect(runCollection[0].bucketId).to.equal(runItem.bucket_key);
          expect(runCollection[0].testId).to.equal(runItem.test_id);
        });
    });
  });

  describe('and trigger by test information', () => {
    it('should call', () => {
      const runItem = {
        bucket_key: uuid(),
        test_id: uuid()
      };

      const runscopeServiceMock = function RunscopeWrapperService() {
        return {
          triggerByUri: sandbox.stub().resolves({
            body: JSON.stringify({data: {runs: [runItem]}})
          })
        };
      };

      mockery.registerMock('./RunscopeWrapperService', runscopeServiceMock);

      const ApiMonitorService = require('../../../src/services/ApiMonitorService.js');
      const apiMonitor = new ApiMonitorService();

      const testInfo = new TestInfo();
      testInfo.triggerUri = 'blah';

      return apiMonitor.triggerByTestInformation(uuid(), testInfo, uuid())
        .then(runCollection => {
          expect(runCollection[0].bucketId).to.equal(runItem.bucket_key);
          expect(runCollection[0].testId).to.equal(runItem.test_id);
        });
    });
  });
});
