var expect    = require('chai').expect;
var WebpackConfig = require('../lib/WebpackConfig');
var path = require('path');
var fs = require('fs');

describe('WebpackConfig object', () => {

    describe('setOutputPath', () => {
        it('use absolute, existent path', () => {
            var config = new WebpackConfig();
            config.setOutputPath(__dirname);

            expect(config.outputPath).to.equal(__dirname);
        });

        it('relative path, becomes absolute', () => {
            var config = new WebpackConfig();
            config.setOutputPath('assets');

            // the "context" dir is resolved to the directory
            // of this plugin, because it holds a package.json
            expect(config.outputPath).to.equal(
                path.join(__dirname, '../assets')
            );

            // cleanup!
            fs.rmdirSync(path.join(__dirname, '../assets'));
        });

        it('non-existent path creates directory', () => {
            var targetPath = path.join(__dirname, 'new_dir');
            if (fs.existsSync(targetPath)) {
                fs.rmdirSync(targetPath);
            }

            var config = new WebpackConfig();
            config.setOutputPath(targetPath);

            expect(fs.existsSync(config.outputPath)).to.be.true;

            // cleanup!
            fs.rmdirSync(targetPath);
        });

        it('non-existent directory, 2 levels deep throws error', () => {
            var targetPath = path.join(__dirname, 'new_dir', 'subdir');
            if (fs.existsSync(targetPath)) {
                fs.rmdirSync(targetPath);
            }

            var config = new WebpackConfig();
            expect(() => {
                config.setOutputPath(targetPath);
            }).to.throw('create this directory');
        });
    });

    describe('setPublicPath', () => {
        it('/foo => /foo/', () => {
            var config = new WebpackConfig();
            config.setPublicPath('/foo');

            expect(config.publicPath).to.equal('/foo/');
        });

        it('/foo/ => /foo/', () => {
            var config = new WebpackConfig();
            config.setPublicPath('/foo/');

            expect(config.publicPath).to.equal('/foo/');
        });

        it('https://example.com => https://example.com/', () => {
            var config = new WebpackConfig();
            config.setPublicPath('https://example.com');

            expect(config.publicPath).to.equal('https://example.com/');
        });

        it('foo/ throws an exception', () => {
            var config = new WebpackConfig();

            expect(() => {
                config.setPublicPath('foo/');
            }).to.throw('The value passed to setPublicPath() must start with "/"');
        });

        it('Setting to a URL when using devServer throws an error', () => {
            var config = new WebpackConfig();
            config.useWebpackDevServer();

            expect(() => {
                config.setPublicPath('https://examplecdn.com');
            }).to.throw('You cannot pass an absolute URL to setPublicPath() and useWebpackDevServer()');
        });
    });

    describe('setManifestKeyPrefix', () => {

        it('You can set it!', () => {
            var config = new WebpackConfig();
            config.setManifestKeyPrefix('/foo');

            // trailing slash added
            expect(config.manifestKeyPrefix).to.equal('/foo/');
        });

        it('You can set it blank', () => {
            var config = new WebpackConfig();
            config.setManifestKeyPrefix('');

            // trailing slash not added
            expect(config.manifestKeyPrefix).to.equal('');
        });
    });

    describe('useWebpackDevServer', () => {
        it('Set with no arguments', () => {
            var config = new WebpackConfig();
            config.setPublicPath('/build');
            config.useWebpackDevServer();

            expect(config.getRealPublicPath()).to.equal('http://localhost:8080/build/');
        });

        it('Set to false', () => {
            var config = new WebpackConfig();
            config.setPublicPath('/build');
            config.useWebpackDevServer(false);

            expect(config.getRealPublicPath()).to.equal('/build/');
            expect(config.webpackDevServerUrl).to.be.null;
        });

        it('Set to true', () => {
            var config = new WebpackConfig();
            config.setPublicPath('/build');
            config.useWebpackDevServer(true);

            expect(config.getRealPublicPath()).to.equal('http://localhost:8080/build/');
        });

        it('Set and control URL', () => {
            var config = new WebpackConfig();
            config.setPublicPath('/build');
            config.useWebpackDevServer('https://localhost:9000');

            expect(config.getRealPublicPath()).to.equal('https://localhost:9000/build/');
        });

        it('Exception if publicPath is set to an absolute URL', () => {
            var config = new WebpackConfig();

            config.setPublicPath('http://foo.com');

            expect(() => {
                config.useWebpackDevServer();
            }).to.throw('You cannot pass an absolute URL to setPublicPath() and useWebpackDevServer()');
        });

        it('Exception if URL is not a URL!', () => {
            var config = new WebpackConfig();

            expect(() => {
                config.useWebpackDevServer('localhost:8090');
            }).to.throw('you must pass an absolute URL (e.g. http://localhost:8090)');
        });
    });

    describe('addEntry', () => {
        it('Calling with a duplicate name throws an error', () => {
            var config = new WebpackConfig();
            config.addEntry('entry_foo', './foo.js');

            expect(() => {
                config.addEntry('entry_foo', './bar.js');
            }).to.throw('Duplicate name');
        });

        it('Calling with a duplicate of addStyleEntry', () => {
            var config = new WebpackConfig();
            config.addStyleEntry('main', './main.scss');

            expect(() => {
                config.addEntry('main', './main.js');
            }).to.throw('conflicts with a name passed to addStyleEntry');
        });
    });

    describe('addStyleEntry', () => {
        it('Calling with a duplicate name throws an error', () => {
            var config = new WebpackConfig();
            config.addStyleEntry('entry_foo', './foo.css');

            expect(() => {
                config.addStyleEntry('entry_foo', './bar.css');
            }).to.throw('Duplicate name');
        });

        it('Calling with a duplicate of addEntry', () => {
            var config = new WebpackConfig();
            config.addEntry('main', './main.scss');

            expect(() => {
                config.addStyleEntry('main', './main.js');
            }).to.throw('conflicts with a name passed to addEntry');
        });
    });

    describe('createSharedEntry', () => {
        it('Calling twice throws an error', () => {
            var config = new WebpackConfig();
            config.createSharedEntry('vendor', 'jquery');

            expect(() => {
                config.createSharedEntry('vendor2', './main');
            }).to.throw('cannot be called multiple');
        });
    });

    describe('autoProvideVariables', () => {
        it('Calling multiple times merges', () => {
            var config = new WebpackConfig();
            config.autoProvideVariables({
                $: 'jquery',
                jQuery: 'jquery'
            });
            config.autoProvideVariables({
                bar: './bar',
                foo: './foo'
            });
            config.autoProvideVariables({
                foo: './foo2'
            });

            expect(JSON.stringify(config.providedVariables))
                .to.equal(JSON.stringify({
                    $: 'jquery',
                    jQuery: 'jquery',
                    bar: './bar',
                    foo: './foo2',
                }))
            ;
        });

        it('Calling with string throws an error', () => {
            var config = new WebpackConfig();

            expect(() => {
                config.autoProvideVariables('jquery');
            }).to.throw('must pass an object');
        });

        it('Calling with an Array throws an error', () => {
            var config = new WebpackConfig();

            expect(() => {
                config.autoProvideVariables(['jquery']);
            }).to.throw('must pass an object');
        });
    });
});
