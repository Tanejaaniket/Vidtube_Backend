#### Description
The content of this file is routes which can be visited by user when it hits a particular endpoint.  
It also contain controller functions that are associated with the route. These routes are further used in app.js file which links endpoint to the further routes.

```js
app.use("/api/v1/health-check", healthCheck);
```
In above e.g the routes will be prepended by "/api/v1/health-check" (Isn't is obvious).

