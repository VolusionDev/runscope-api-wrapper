const expect = require('chai').expect;
const TestInfo = require('./../../src/models/TestInfo');
const uuid = require('uuid');

describe('When using testinfo', () => {
  it('and init with all null', () => {
    const t = new TestInfo(null, null, null, null, null, null, null);
    console.log(t);

    expect(t.name).to.equal('');
    expect(t.id).to.equal('');
    expect(t.triggerUri).to.equal('');
    expect(t.triggerId).to.equal('');
    expect(t.defaultEnvironmentId).to.equal('');
    expect(t.results).to.deep.equal([]);
    expect(t.schedules).to.deep.equal([]);
    expect(t.success).to.deep.equal('');
  });

  it('and init without any', () => {
    const t = new TestInfo();

    expect(t.name).to.equal('');
    expect(t.id).to.equal('');
    expect(t.triggerUri).to.equal('');
    expect(t.triggerId).to.equal('');
    expect(t.defaultEnvironmentId).to.equal('');
    expect(t.results).to.deep.equal([]);
    expect(t.schedules).to.deep.equal([]);
    expect(t.success).to.deep.equal('');
  });

  it('and init and valid trigger uri supplied', () => {
    const expectedTriggerId = uuid.v4();
    const expectedTriggerUri = `http://api.runscope.com/radar/${expectedTriggerId}/trigger`;

    const t = new TestInfo(null, null, null, null, null, null, expectedTriggerUri);

    expect(t.name).to.equal('');
    expect(t.id).to.equal('');
    expect(t.triggerUri).to.equal(expectedTriggerUri);
    expect(t.triggerId).to.equal(expectedTriggerId);
    expect(t.defaultEnvironmentId).to.equal('');
    expect(t.results).to.deep.equal([]);
    expect(t.schedules).to.deep.equal([]);
    expect(t.success).to.deep.equal('');
  });

  it('and init and valid trigger uri supplied (a live example)', () => {
    const expectedTriggerId = uuid.v1();
    const expectedTriggerUri = `https://api.runscope.com/radar/${expectedTriggerId}/trigger`;

    const t = new TestInfo(null, null, null, null, null, null, expectedTriggerUri);

    expect(t.name).to.equal('');
    expect(t.id).to.equal('');
    expect(t.triggerUri).to.equal(expectedTriggerUri);
    expect(t.triggerId).to.equal(expectedTriggerId);
    expect(t.defaultEnvironmentId).to.equal('');
    expect(t.results).to.deep.equal([]);
    expect(t.schedules).to.deep.equal([]);
    expect(t.success).to.deep.equal('');
  });
});
