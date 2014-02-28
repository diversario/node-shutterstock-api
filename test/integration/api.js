var should = require('should');
var nock = require('nock');
var MockApi = require('../setup/helper')
var Api = require('./../../lib/index');
var credentials = require('../setup/credentials.json');

var mockApi = new MockApi(credentials);

/*
 * Create a new API instance
 */
var api = new Api(credentials.apiUser, credentials.apiKey);

/*
 * Reference values
 */
var lightboxId;
var authenticatedCustomer;

/*
 * Basic tests
 */
describe('API', function() {

  // get a customer
	beforeEach(function(done) {
    mockApi.mockAuth();

		api.auth(credentials.username, credentials.password, function(err, customer, res) {
      should.not.exist(err);
			customer.should.have.property('username', credentials.username);
			authenticatedCustomer = customer;
			done();
		});
	});

	it('should get categories', function(done) {
		api.categories(function(err, categories) {
      should.not.exist(err);
			categories.should.be.instanceof(Array);
			categories.should.have.lengthOf(26);
			done();
		});
	});

	it('should get an image', function(done) {
		api.image(200000, function(err, data) {
			data.should.have.property('photo_id', 200000);
			data.should.have.property('submitter', 'irina');
			data.should.have.property('description', 'one yellow-red tulip in the field of red');
			done();
		});
	});

	it('should search for images', function(done) {
		api.searchImages({
			searchterm: 'tigers',
			search_group: 'vectors',
			safesearch: 0,
			page_number: 1,
			sort_method: 'popular'
		}, function(err, data) {
			data.should.have.property('page', '1');
			data.should.have.property('sort_method', 'popular');
			data.results.should.be.instanceof(Array);
			data.results.should.have.property('length', 150);
			done();
		});
	});

	it('should get a video', function(done) {
		api.video(1042708, function(err, data) {
			data.should.have.property('video_id', 1042708);
			data.should.have.property('submitter_id', 511126);
			data.should.have.property('description', 'Traffic Lights at night timelapse');
			done();
		});
	});

	it('should search for videos', function(done) {
		api.searchVideos({
			searchterm: 'monkeys',
			page_number: 1,
			sort_method: 'popular'
		}, function(err, data) {
			data.should.have.property('page', '1');
			data.results.should.be.instanceof(Array);
			data.results.should.have.property('length', 150);
			done();
		});
	});

	it('should get subscriptions', function(done) {
		authenticatedCustomer.subscriptions(function(err, subscriptions) {
			subscriptions.should.be.instanceof(Array);
			done();
		});
	});

	it('should get lightboxes', function(done) {
		authenticatedCustomer.lightboxes(function(err, lightboxes) {
			lightboxes.should.be.instanceof(Array);
			lightboxId = lightboxes[0].lightbox_id;
			done();
		});
	});

	it('should get a lightbox', function(done) {
		authenticatedCustomer.lightbox(lightboxId, function(err, lightbox) {
			lightbox.should.have.property('lightbox_id', lightboxId);
			lightbox.images.should.be.instanceof(Array);
			done();
		});
	});

	it('should get image downloads', function(done) {
		authenticatedCustomer.imageDownloads(1, 40, function(err, downloads) {
			downloads.should.be.instanceof(Object);
			done();
		});
	});

  it("should license a video", function(done) {
    nock(mockApi.baseUrl())
      .get('/customers/user_name/subscriptions.json?auth_token=mock_auth_token')
      .reply(200, [
        {
          site: 'photo',
          is_active: true,
          id: 'sub_id_goes_here',
          sizesForLicensing: ['big', 'small']
        }
      ])

    nock(mockApi.baseUrl())
      .post('/subscriptions/sub_id_goes_here/video/vid_id/sizes/big.json')
      .reply(200, {
        download: {url: 'foo.com/downloadurl'},
        thumb_large: {url: 'foo.com/thumb_largeurl'},
        allotmentCharge: '9001'
      })

    authenticatedCustomer.licenseVideo('vid_id', {size: 'big'}, function(err, video, res) {
      should.not.exist(err);
      video.should.have.property('downloadUrl', 'foo.com/downloadurl')
      video.should.have.property('thumbUrl', 'foo.com/thumb_largeurl')
      video.should.have.property('type', 'video')
      video.should.have.property('allotmentCharge', '9001')
      done();
    });
  });

});
