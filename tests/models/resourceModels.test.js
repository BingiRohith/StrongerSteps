import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Resource from '@/models/Resource.js';
import ResourceCategory from '@/models/ResourceCategory.js';
import ResourceFile from '@/models/ResourceFile.js';
import DownloadLog from '@/models/DownloadLog.js';

// Mirrors tests/models/courseModels.test.js's approach — validateSync()
// covers schema-level rules (required/enum/maxlength/min) without a DB
// connection and without the async pre('validate') hooks (slug
// generation, publishedAt stamping). Does NOT cover slug uniqueness,
// the publish-lifecycle hook, fileTypes denormalization, or soft-delete
// query filtering — those need a live MongoDB, same standing limitation
// as every other model in this project's test suite.

const VALID_CATEGORY_ID = '507f1f77bcf86cd799439011';
const VALID_RESOURCE_ID = '507f1f77bcf86cd799439012';

describe('Resource validation', () => {
  it('rejects a resource with no title or category', () => {
    const resource = new Resource({});
    const error = resource.validateSync();
    assert.ok(error);
    assert.ok(error.errors.title);
    assert.ok(error.errors.category);
  });

  it('accepts a resource with just title and category (everything else defaults)', () => {
    const resource = new Resource({ title: 'Healthy Ageing Guide', category: VALID_CATEGORY_ID });
    const error = resource.validateSync();
    assert.equal(error, undefined);
    assert.equal(resource.status, 'draft');
    assert.equal(resource.accessLevel, 'PUBLIC');
    assert.equal(resource.language, 'English');
    assert.equal(resource.estimatedReadingTime, 0);
    assert.equal(resource.deletedAt, null);
    assert.deepEqual(resource.fileTypes, []);
  });

  it('rejects an invalid accessLevel value', () => {
    const resource = new Resource({
      title: 'Test Resource',
      category: VALID_CATEGORY_ID,
      accessLevel: 'FREE_TIER', // not a real ACCESS_LEVELS value
    });
    const error = resource.validateSync();
    assert.ok(error?.errors.accessLevel);
  });

  it('rejects a negative estimatedReadingTime', () => {
    const resource = new Resource({
      title: 'Test Resource',
      category: VALID_CATEGORY_ID,
      estimatedReadingTime: -5,
    });
    const error = resource.validateSync();
    assert.ok(error?.errors.estimatedReadingTime);
  });

  it('dedupes and lowercases tags and keywords independently', () => {
    const resource = new Resource({
      title: 'Test Resource',
      category: VALID_CATEGORY_ID,
      tags: ['Falls', 'falls', ' Mobility '],
      keywords: ['SENIOR', 'senior', 'checklist'],
    });
    assert.deepEqual(resource.tags, ['falls', 'mobility']);
    assert.deepEqual(resource.keywords, ['senior', 'checklist']);
  });
});

describe('ResourceCategory validation', () => {
  it('rejects a category with no name', () => {
    const category = new ResourceCategory({});
    const error = category.validateSync();
    assert.ok(error?.errors.name);
  });

  it('accepts a category with just a name', () => {
    const category = new ResourceCategory({ name: 'Assessments' });
    const error = category.validateSync();
    assert.equal(error, undefined);
    assert.equal(category.isActive, true);
  });
});

describe('ResourceFile validation', () => {
  it('rejects a file with no resource, title, or fileType', () => {
    const file = new ResourceFile({});
    const error = file.validateSync();
    assert.ok(error?.errors.resource);
    assert.ok(error?.errors.title);
    assert.ok(error?.errors.fileType);
  });

  it('accepts a minimal file and defaults accessLevel/previewAvailable/downloadable/currentVersion', () => {
    const file = new ResourceFile({ resource: VALID_RESOURCE_ID, title: 'Guide PDF', fileType: 'pdf' });
    const error = file.validateSync();
    assert.equal(error, undefined);
    assert.equal(file.accessLevel, 'PUBLIC');
    assert.equal(file.previewAvailable, false);
    assert.equal(file.downloadable, true);
    assert.equal(file.currentVersion, 1);
    assert.equal(file.deletedAt, null);
    assert.equal(file.file.storageProvider, 'local');
  });

  it('rejects an invalid fileType', () => {
    const file = new ResourceFile({
      resource: VALID_RESOURCE_ID,
      title: 'Guide',
      fileType: 'text-document', // not in FILE_TYPE_VALUES
    });
    const error = file.validateSync();
    assert.ok(error?.errors.fileType);
  });

  it('accepts every declared access level', () => {
    for (const accessLevel of ['PUBLIC', 'OTP', 'MEMBER', 'PURCHASED', 'ADMIN']) {
      const file = new ResourceFile({
        resource: VALID_RESOURCE_ID,
        title: 'Guide',
        fileType: 'pdf',
        accessLevel,
      });
      const error = file.validateSync();
      assert.equal(error, undefined, `accessLevel ${accessLevel} should be valid`);
    }
  });

  it('accepts an external_link file with no binary file', () => {
    const file = new ResourceFile({
      resource: VALID_RESOURCE_ID,
      title: 'Related Reading',
      fileType: 'external_link',
      externalUrl: 'https://example.com/article',
    });
    const error = file.validateSync();
    assert.equal(error, undefined);
  });
});

describe('DownloadLog validation', () => {
  it('rejects a log with no resourceType or resourceId', () => {
    const log = new DownloadLog({});
    const error = log.validateSync();
    assert.ok(error?.errors.resourceType);
    assert.ok(error?.errors.resourceId);
  });

  it('accepts a minimal log entry with no lead (public download)', () => {
    const log = new DownloadLog({ resourceType: 'resource', resourceId: VALID_RESOURCE_ID, fileKind: 'abc123' });
    const error = log.validateSync();
    assert.equal(error, undefined);
    assert.equal(log.lead, null);
    assert.ok(log.downloadedAt instanceof Date);
  });
});
