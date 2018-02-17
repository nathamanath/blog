module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^(?!app)/,
        'app.js': /^app/
      }
    },
    stylesheets: { joinTo: {
        'app.css': /^app\/stylesheets\/application\.sass/
      }
    }
  },

  plugins: {
    babel: {
      presets: ['es2015']
    },
    sass: {
      mode: 'native'
    }
  },

  paths: {
    public: '../public'
  }
};
