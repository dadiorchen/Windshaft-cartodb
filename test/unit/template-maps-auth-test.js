'use strict';

require('../support/test-helper');

var assert = require('assert');
var RedisPool = require('redis-mpool');

var TemplateMaps = require('../../lib/backends/template-maps');

describe('template_maps_auth', function () {
    // configure redis pool instance to use in tests
    var redisPool = new RedisPool(global.environment.redis);
    var templateMaps = new TemplateMaps(redisPool, { max_user_templates: 1000 });

    function makeTemplate (method, validTokens) {
        var template = {
            name: 'wadus_template',
            auth: {
                method: method
            }
        };

        if (method === 'token') {
            template.auth.valid_tokens = validTokens || [];
        }

        return template;
    }

    var methodToken = 'token';
    var methodOpen = 'open';

    var tokenFoo = 'foo';
    var tokenBar = 'bar';

    var authorizationTestScenarios = [
        {
            desc: 'open method is always authorized',
            template: makeTemplate(methodOpen),
            token: undefined,
            expected: true
        },
        {
            desc: 'token method is authorized for valid token',
            template: makeTemplate(methodToken, [tokenFoo]),
            token: tokenFoo,
            expected: true
        },
        {
            desc: 'token method not authorized for invalid token',
            template: makeTemplate(methodToken, [tokenFoo]),
            token: tokenBar,
            expected: false
        },
        {
            desc: 'token method is authorized for valid token array',
            template: makeTemplate(methodToken, [tokenFoo]),
            token: [tokenFoo],
            expected: true
        },
        {
            desc: 'token method not authorized for invalid token array',
            template: makeTemplate(methodToken, [tokenFoo]),
            token: [tokenBar],
            expected: false
        },
        {
            desc: 'wadus method not authorized',
            template: makeTemplate('wadus', [tokenFoo]),
            token: tokenFoo,
            expected: false
        },
        {
            desc: 'undefined template result in not authorized',
            template: undefined,
            token: tokenFoo,
            expected: false
        },
        {
            desc: 'undefined template auth result in not authorized',
            template: {},
            token: tokenFoo,
            expected: false
        }
    ];

    authorizationTestScenarios.forEach(function (testScenario) {
        it(testScenario.desc, function (done) {
            var debugMessage = testScenario.expected ? 'should be authorized' : 'unexpectedly authorized';
            var result = templateMaps.isAuthorized(testScenario.template, testScenario.token);
            assert.strictEqual(result, testScenario.expected, debugMessage);
            done();
        });
    });

    it("auth as 'open' string is authorized", function (done) {
        var template = {
            name: 'wadus_template',
            auth: 'open'
        };

        assert.ok(templateMaps.isAuthorized(template));
        done();
    });
});
