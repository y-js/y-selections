
# Selections Type for [Yjs](https://github.com/y-js/yjs)

Manage selections on y-list objects with this shareable type.

## Use it!
Retrieve this with bower or npm.

##### Bower
```
bower install y-selections --save
```

and include the js library.

```
<script src="./bower_components/y-selections/y-selections.js"></script>
```

##### NPM
```
npm install y-selections --save
```
and put it on the `Y` object.

```
Y.Selections = require("y-selections");
```

### Selections Object

##### Reference
* Create
```
var ysel = new Y.Selections()
```
* .select(from, to, attrs)
  * Assign a set of attributes to a range. This method expects *references* (see y-list documentation) as the first two parameters (from, and to), and *attrs* should be an _Object_. Make sure that *from* is a predecessor of *to*!
* .unselect(from, to, attrs)
  * Remove a set of attributes from a range. This method expects *references* (see y-list documentation) as the first two parametrs (from, and to), and *attrs* should be an _Array_. Make sure that *from* is a predecessor of *to*!
* .unselectAll(from, to)
  * Remove all attributes from a range. This method expects *references* (see y-list documentation) as the first two parametrs (from, and to). Make sure that *from* is a predecessor of *to*!
* .observe(f)
  * The observer is called whenever something on this text object changed. (throws select, and unselect events)
* .unobserve(f)
  * Delete an observer

## License
Yjs and y-selections are licensed under the [MIT License](./LICENSE.txt).

<kevin.jahns@rwth-aachen.de>
