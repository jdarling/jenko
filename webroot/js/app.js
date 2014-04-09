
var Application = function(){
  var self = this;
  var aboutPageLoaded = false;
  var startedPageLoaded = false;
  var useSockets = false;
  var partials = self.partials = new Partials({
    path: "partials/",
    ext: ".html"
  });
  var trap = function(e){
    console.error(e);
  };

  var displayPage = self.displayPage = function(pageName, data){
    var path = pageName.split('/');
    var nav = path.shift();

    partials.get(pageName, function(err, template){
      if(err){
        return trap(err);
      }
      try{
        var pane = el('#outlet');
        var controllerName = el('#'+pageName).getAttribute('data-controller');
        if(nav==='index'){
          nav = el('nav li a[href="#home"]');
        }else{
          nav = el('nav li a[href="#'+(nav||'home')+'"]');
        }
        pane.innerHTML = template(data||{}, {helpers: handlebarsHelpers});
        if(controllerName){
          controllers.create(pane, controllerName, data);
        }
      }catch(e){
        trap(e);
      }
    });
  };

  self.init = function(){
    var nav = Satnav({
      html5: false,
      force: true,
      poll: 100
    });

    nav
      .navigate({
        path: '/',
        directions: function(params){
          Loader.get('/api/v1/jenkins/jobs', function getJobs(err, jobs){
            if(err){
              displayPage('error', err);
            }else{
              jobs = jobs.sort(function(jobA, jobB){
                return jobA.name.localeCompare(jobB.name);
              });
              displayPage('home', jobs);
            }
          });
        }
      })
      .navigate({
        path: '/job/{name}',
        directions: function(params){
          Loader.get('api/v1/jenkins/job/'+params.name, function(err, job){
            if(job.builds && job.builds.length){
              Loader.get('api/v1/jenkins/job/'+params.name+'/build/'+job.builds[0].number+'/output', function(err, output){
                if(err){
                  displayPage('error', err);
                }else{
                  job.output = output;
                  displayPage('job', job);
                }
              });
            }else{
                if(err){
                  displayPage('error', err);
                }else{
                  displayPage('job', job);
                }
            }
          });
        }
      })
      .change(function(params, old){
        displayPage('loading');
        nav.resolve();
        return this.defer;
      })
      .otherwise('/');
      ;
    nav.go();
  };
  
  var socket = self.socket = io.connect();
  socket.on('connect', function(){
    useSockets = true;
  });
  
  socket.on('message', function(msg){
    console.log('Message: ', msg);
  });

  socket.on('job:added', function(msg){
    console.log('job:added: ', msg);
  });

  socket.on('job:updated', function(msg){
    console.log('job:updated: ', msg);
  });

  socket.on('disconnect', function(){
    useSockets = false;
  });
};

var application = new Application();
application.partials.preload(application.init);

Loader.get('/api/v1/jenkins/server', function(err, serverUrl){
  el('title').innerText = 'Jenko - '+serverUrl;
  var logo = el('#header_logo_text').parentNode;
  var newNode = document.createElement('li');
  newNode.innerHTML = '<a class="logoPlaceholder" href="'+serverUrl+'" target="_blank">'+serverUrl+'</a>';
  logo.parentNode.insertBefore(newNode, logo.nextSibling);
});
