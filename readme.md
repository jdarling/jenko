Jenko
=====

A jenkins dashboard developed in Node.js.

This is the initial release and really it only supports a dashboard view of Jenkins while letting you drill into each job to see the last output.  Built in cache behind the UI designed to minimize the press on your Jenkins machine while allowing the UI to do continual polling to stay updated.

Why?
----

Because I was looking for a dashboard for Jenkins and all I found was ones that required CORS or were developed in Python or Ruby.  Already use Node.js so why not re-invent the wheel :)

Todo
----

Lots:

    * Make it so you can npm install -g
    * Implement web sockets
    * Add UI configuration endpoint to API, so UI can be configured from backend
    * Cache more information where we can, only job/{name} is currently cached
    * Move the enrichment from the UI to the backend
    * Reports, charts, graphs...
    * Add a help screen
    * Documentation, usage, setup, help, credits, etc...
    * Add system configuration to the UI?

Installation
-----------

```
npm install jenko
```

Then CD to the directory and run: "node server"

Configuration
-------------

config.json

Uses a "dirty JSON" format.  So long as it is a valid JavaScript object it will load.  Actually processed using Node's VM module.

```javascript
{
  default: {
    jenkins: {
      host: 'https://ci.jenkins-ci.org' // Jenkins Server with API
      // Lots more you can do here, look at the lib/jenkins.js file to see how you can override any of the endpoints
    },
    queue: {
      refreshRate: 5000, // Milliseconds between polling Jenkins Server
      concurrency: 5 // Max number of requests to make to server at one time
    }
  },
  production: {
    // Production settings, same as above
  }
}
```

Any config option can also be provided via the commandline, like so:

```
node server --jenkins.host=https://ci.jenkins-ci.org
```

Bugs, Features, etc...
------------------------------

Pull requests and ideas welcome.