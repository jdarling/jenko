var controllers = new Controllers();

var BadgeSorter = function(){
  var self = this;
  self.badges = [];
};
BadgeSorter.prototype.add = function(badge){
  var self = this;
  self.badges.push(badge);
};
BadgeSorter.prototype.queueUpdate = function(){
  var self = this;
  clearTimeout(self.tmr);
  self.tmr = setTimeout(function(){
    self.update();
  }, 1000);
};
BadgeSorter.prototype.update = function(){
  var self = this;
  var i, l = self.badges.length;
  var weighJob = function(job){
    if(job.inQueue||job.running){
      return -2;
    }
    if(/_anime$/.exec(job.color)){
      return -3;
    }
    switch(job.color){
      case('grey'):
        return 2;
      case('yellow'):
        return -1;
      case('blue'):
        return 1;
      case('red'):
        return -1;
      default:
        return 2;
    }
  };
  var weigh = function(A, B){
    var jobA = A.data, jobB = B.data;
    var wA = weighJob(jobA), wB = weighJob(jobB);
    if(wA==wB && wA != 2){
      return (jobA.displayName||jobA.name).localeCompare(jobB.displayName||jobB.name);
    }
    return wA-wB;
  };
  if(l==0){
    return;
  }
  var outlet = self.badges[0].container;
  while(outlet && (outlet.nodeName.toUpperCase() !== 'UL')){
    outlet = outlet.parentNode;
  }
  var parent = outlet.parentNode;
  var next = outlet.nextSibling;
  clearTimeout(self.tmr);
  document.body.removeEventListener('DOMNodeRemoved', cleanupControllers, true);
  parent.removeChild(outlet);
  self.badges = self.badges.sort(weigh);
  for(i=0; i<l; i++){
    container = self.badges[i].container;
    while(container && (container.nodeName.toUpperCase() !== 'LI')){
      container = container.parentNode;
    }
    if(container){
      outlet.appendChild(container);
    }else{
      console.log('not part of outlet');
    }
  }
  parent.insertBefore(outlet, next);
  document.body.addEventListener('DOMNodeRemoved', cleanupControllers, true);
};
BadgeSorter.prototype.remove = function(badge){
  var self = this;
  var idx = self.badges.indexOf(badge);
  if(idx>-1){
    self.badges.splice(idx, 1);
  }
};
var badgeSorter = new BadgeSorter();

badgeUpdateQueue = async.queue(function(task, done){
  Loader.get(task.uri, function(err, job){
    if(err){
      return done();
    }
    job.class = 'ink-badge ';
    switch((job.color||'').replace(/_anime$/, '')){
      case('yellow'):
        job.class += 'orange';
        break;
      case('grey'):
        job.class += 'grey';
        break;
      case('aborted'):
        job.class += 'black';
        break;
      case('nobuilt'):
        job.class += 'grey';
        break;
      case('blue'):
        job.class += 'green';
        break;
      case('red'):
        job.class += 'red';
        break;
      case('disabled'):
        job.class += 'grey';
        break;
      default:
        job.class += 'grey';
    }
    if((job.color||'').match(/_anime$/)){
      job.running = true;
      job.class = 'ink-badge black';
    }else{
      job.running = false;
    }
    job.linkName = encodeURI(job.name);
    task.badge.dirty = JSON.stringify(task.badge.data)!=JSON.stringify(job);
    if(task.badge.dirty){
      task.badge.data = job;
    }
    done();
  });
}, 5);

var JobBadgeController = function(container, data){
  var self = this;
  self.template = Handlebars.compile(data.template);
  self.data = data.data;
  self.container = container;
  self.update();
  container.controller = self;
  badgeSorter.add(self);
};
JobBadgeController.prototype.update = function(){
  var self = this;
  var container = self.container;
  var html = self.template(self.data, {helpers: handlebarsHelpers});
  var job = self.data;
  badgeUpdateQueue.push({
    uri: '/api/v1/jenkins/job/'+job.name,
    badge: self
  }, function(){
    if(!self.dead){
      if(self.dirty){
        container.innerHTML = self.template(self.data, {helpers: handlebarsHelpers});
        self.dirty = false;
      }
      badgeSorter.queueUpdate();
      self.tmr = setTimeout(function(){
        self.update();
      }, 15000);
    }
  });
};
JobBadgeController.prototype.teardown = function(){
  var self = this;
  delete self.template;
  delete self.container;
  self.dead = true;
  self.container = null;
  clearTimeout(self.tmr);
  badgeSorter.remove(self);
};

controllers.register('jobBadge', JobBadgeController);

var JobOutputController = function(container, data){
  var sel = el(container, 'select');
  var btn = el(container, 'button');

  var displayOutput = function(endpoint){
    var out = el(container, 'pre');
    out.innerHTML = 'Loading...';
    Loader.get(endpoint, function(err, data){
      out.innerHTML = data;
    });
  };

  btn.onclick = function(e){
    e.preventDefault();
    displayOutput(sel.value);
    return false;
  };
  sel.onchange = function(e){
    e.preventDefault();
    displayOutput(sel.value);
    return false;
  };
};

controllers.register('joboutput', JobOutputController);

var cleanupControllers = function (e) {
  var walkForRemoval = function(node){
    if(node && node.children){
      var i, l = node.children.length, child;
      for(i=0; i<l; i++){
        child = node.children[i];
        walkForRemoval(child);
      }
    }
    if(node.controller){
      if(node.controller.teardown){
        node.controller.teardown();
      }
      delete node.controller;
    }
  };
  if(e.type=='DOMNodeRemoved'){
    var n = e.target;
    walkForRemoval(n);
  }
};

document.body.addEventListener('DOMNodeRemoved', cleanupControllers, true);
