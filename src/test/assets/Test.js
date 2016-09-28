var assert = require("assert");
describe("Foo", function() {
    it("say hello", function() {
        var arpnet = require('./export');

        console.log(arpnet);
        assert.equal("world", "hello world");
    });
});
