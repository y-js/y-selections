(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var YSelections, compare_objects;

compare_objects = function(obj1, obj2, doAgain) {
  var key, value;
  if (doAgain == null) {
    doAgain = true;
  }
  for (key in obj1) {
    value = obj1[key];
    if (!((obj2[key] != null) && obj2[key] === value)) {
      return false;
    }
  }
  if (doAgain) {
    return compare_objects(obj2, obj1, false);
  } else {
    return true;
  }
};

YSelections = (function() {
  function YSelections() {
    this._listeners = [];
    this._composition_value = [];
    this._lists = [];
  }

  YSelections.prototype._name = "Selections";

  YSelections.prototype._getModel = function(Y, Operation) {
    if (this._model == null) {
      this._model = new Operation.Composition(this, []).execute();
    }
    return this._model;
  };

  YSelections.prototype._setModel = function(_model) {
    this._model = _model;
  };

  YSelections.prototype._getCompositionValue = function() {
    var composition_value, composition_value_operations, index, value;
    composition_value_operations = {};
    composition_value = (function() {
      var _i, _len, _ref, _results;
      _ref = this._composition_value;
      _results = [];
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        value = _ref[index];
        composition_value_operations["" + index + "/from"] = value.from;
        composition_value_operations["" + index + "/to"] = value.to;
        _results.push({
          attrs: value.attrs
        });
      }
      return _results;
    }).call(this);
    return {
      composition_value: composition_value,
      composition_value_operations: composition_value_operations
    };
  };

  YSelections.prototype._setCompositionValue = function(composition_value) {
    var value, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = composition_value.length; _i < _len; _i++) {
      value = composition_value[_i];
      value.type = "select";
      _results.push(this._apply(value));
    }
    return _results;
  };

  YSelections.prototype._apply = function(delta) {
    var a, attr, attr_list, createSelection, cut_off_from, cut_off_to, delta_has_attrs, elem, elem_next, end, extendSelection, from, listener, n, observer_call, p, parent, parent_exists, selection, selection_is_empty, start, to, to_next, undos, v, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    undos = [];
    if (delta.from.isDeleted()) {
      delta.from = delta.from.getNext();
    }
    if (delta.to.isDeleted()) {
      delta.to = delta.to.getPrev();
    }
    from = delta.from;
    to = delta.to;
    if (from.getPrev() === to) {
      return undos;
    }
    if (delta.type === "select") {
      parent = from.getParent();
      parent_exists = false;
      _ref = this._lists;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        if (parent === this._lists[p]) {
          parent_exists = true;
          break;
        }
      }
      if (!parent_exists) {
        this._lists.push(parent);
        parent.observe((function(_this) {
          return function(events) {
            var event, next, prev, ref, sel, _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = events.length; _j < _len1; _j++) {
              event = events[_j];
              if (event.type === "delete") {
                if (event.reference.selection != null) {
                  ref = event.reference;
                  sel = ref.selection;
                  delete ref.selection;
                  if (sel.from === ref && sel.to === ref) {
                    _this._removeFromCompositionValue(sel);
                  } else if (sel.from === ref) {
                    next = ref.getNext();
                    sel.from = next;
                    next.selection = sel;
                  } else if (sel.to === ref) {
                    prev = ref.getPrev();
                    sel.to = prev;
                    prev.selection = sel;
                  } else {
                    throw new Error("Found weird inconsistency! Y.Selections is no longer safe to use!");
                  }
                }
                next = event.reference.getNext();
                if (next.selection != null) {
                  _results.push(_this._combine_selection_to_left(next.selection));
                } else {
                  _results.push(void 0);
                }
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
        })(this));
      }
    }
    observer_call = {
      from: from,
      to: to,
      type: delta.type,
      attrs: delta.attrs
    };
    _ref1 = this._listeners;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      listener = _ref1[_j];
      listener.call(this, observer_call);
    }
    createSelection = (function(_this) {
      return function(from, to, attrs) {
        var key, new_attrs, new_sel, value;
        new_attrs = {};
        for (key in attrs) {
          value = attrs[key];
          new_attrs[key] = value;
        }
        new_sel = {
          from: from,
          to: to,
          attrs: new_attrs
        };
        _this._composition_value.push(new_sel);
        return new_sel;
      };
    })(this);
    extendSelection = function(selection) {
      var key, n, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v, value, _k, _len2, _ref2, _ref3, _ref4;
      if (delta.type === "unselect") {
        undo_attrs = {};
        _ref2 = delta.attrs;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          key = _ref2[_k];
          if (selection.attrs[key] != null) {
            undo_attrs[key] = selection.attrs[key];
          }
          delete selection.attrs[key];
        }
        return undos.push({
          from: delta.from,
          to: delta.to,
          attrs: undo_attrs,
          type: "select"
        });
      } else {
        undo_attrs = {};
        undo_attrs_list = [];
        undo_need_unselect = false;
        undo_need_select = false;
        if ((delta.overwrite != null) && delta.overwrite) {
          _ref3 = selection.attrs;
          for (key in _ref3) {
            value = _ref3[key];
            if (delta.attrs[n] == null) {
              undo_need_select = true;
              undo_attrs[key] = value;
            }
          }
          for (n in undo_attrs) {
            v = undo_attrs[n];
            delete selection.attrs[key];
          }
        }
        _ref4 = delta.attrs;
        for (key in _ref4) {
          value = _ref4[key];
          if (selection.attrs[key] != null) {
            undo_attrs[key] = selection.attrs[key];
            undo_need_select = true;
          } else {
            undo_attrs_list.push(key);
            undo_need_unselect = true;
          }
          selection.attrs[key] = value;
        }
        if (undo_need_select) {
          undos.push({
            from: selection.from,
            to: selection.to,
            attrs: undo_attrs,
            type: "select"
          });
        }
        if (undo_need_unselect) {
          return undos.push({
            from: selection.from,
            to: selection.to,
            attrs: undo_attrs_list,
            type: "unselect"
          });
        }
      }
    };
    cut_off_from = function() {
      var element, new_selection, old_selection, opt_selection;
      if ((from.selection != null) && from.selection.from === from) {
        return;
      }
      element = from.prev_cl;
      while ((element.selection == null) && (element.type !== "Delimiter")) {
        element = element.prev_cl;
      }
      if ((element.selection == null) || element.selection.to === element) {
        return;
      }
      old_selection = element.selection;
      element = from;
      while ((element !== old_selection.to) && (element !== to)) {
        element = element.getNext();
      }
      if (element === old_selection.to) {
        new_selection = createSelection(from, old_selection.to, old_selection.attrs);
        old_selection.to = from.getPrev();
        old_selection.to.selection = old_selection;
        new_selection.from.selection = new_selection;
        return new_selection.to.selection = new_selection;
      } else {
        new_selection = createSelection(from, to, old_selection.attrs);
        opt_selection = createSelection(to.getNext(), old_selection.to, old_selection.attrs);
        old_selection.to = from.getPrev();
        old_selection.to.selection = old_selection;
        opt_selection.from.selection = opt_selection;
        opt_selection.to.selection = opt_selection;
        new_selection.from.selection = new_selection;
        return new_selection.to.selection = new_selection;
      }
    };
    cut_off_from();
    cut_off_to = function() {
      var element, new_selection, old_selection;
      if ((to.selection != null) && to.selection.to === to) {
        return;
      }
      element = to;
      while ((element.selection == null) && (element !== from)) {
        element = element.getPrev();
      }
      if ((element.selection == null) || element.selection["to"] === element) {
        return;
      }
      old_selection = element.selection;
      new_selection = createSelection(to.getNext(), old_selection.to, old_selection.attrs);
      old_selection.to = to;
      old_selection.to.selection = old_selection;
      new_selection.from.selection = new_selection;
      return new_selection.to.selection = new_selection;
    };
    cut_off_to();
    delta_has_attrs = false;
    for (a in delta.attrs) {
      delta_has_attrs = true;
      break;
    }
    elem = from;
    to_next = to.getNext();
    while (elem !== to_next) {
      if (elem.selection != null) {
        extendSelection(elem.selection, delta);
        selection = elem.selection;
        this._combine_selection_to_left(selection);
        elem = selection.to.getNext();
        selection_is_empty = true;
        for (attr in selection.attrs) {
          selection_is_empty = false;
          break;
        }
        if (selection_is_empty) {
          this._removeFromCompositionValue(selection);
        }
      } else {
        start = elem;
        elem_next = elem.getNext();
        while ((elem_next.selection == null) && (elem !== to)) {
          elem = elem_next;
          elem_next = elem.getNext();
        }
        end = elem;
        if (delta.type !== "unselect" && delta_has_attrs) {
          attr_list = [];
          _ref2 = delta.attrs;
          for (n in _ref2) {
            v = _ref2[n];
            attr_list.push(n);
          }
          undos.push({
            from: start,
            to: end,
            attrs: attr_list,
            type: "unselect"
          });
          selection = createSelection(start, end, delta.attrs);
          start.selection = selection;
          end.selection = selection;
          this._combine_selection_to_left(elem.selection);
        }
        elem = elem.getNext();
      }
    }
    if (elem.selection != null) {
      this._combine_selection_to_left(elem.selection);
    }
    if (from.selection != null) {
      this._combine_selection_to_left(from.selection);
    }
    return undos;
  };

  YSelections.prototype._removeFromCompositionValue = function(selectionToRemove) {
    this._composition_value = this._composition_value.filter(function(sel) {
      return sel !== selectionToRemove;
    });
    delete selectionToRemove.from.selection;
    return delete selectionToRemove.to.selection;
  };

  YSelections.prototype._combine_selection_to_left = function(sel) {
    var first_elem, new_from;
    first_elem = sel.from.getPrev();
    if (first_elem.selection == null) {

    } else {
      if (compare_objects(first_o.selection.attrs, sel.attrs)) {
        new_from = first_o.selection.from;
        this._removeFromCompositionValue(first_o.selection);
        if (sel.from !== sel.to) {
          delete sel.from.selection;
        }
        sel.from = new_from;
        return new_from.selection = sel;
      } else {

      }
    }
  };

  YSelections.prototype._unapply = function(deltas) {
    var delta, _i, _len;
    for (_i = 0, _len = deltas.length; _i < _len; _i++) {
      delta = deltas[_i];
      this._apply(delta);
    }
  };

  YSelections.prototype.select = function(from, to, attrs, overwrite) {
    var a, delta, delta_operations, length;
    length = 0;
    for (a in attrs) {
      length++;
      break;
    }
    if (length <= 0 && !((overwrite != null) && overwrite)) {
      return;
    }
    delta_operations = {
      from: from,
      to: to
    };
    delta = {
      attrs: attrs,
      type: "select"
    };
    if ((overwrite != null) && overwrite) {
      delta.overwrite = true;
    }
    return this._model.applyDelta(delta, delta_operations);
  };

  YSelections.prototype.unselectAll = function(from, to) {
    return select(from, to, {}, true);
  };

  YSelections.prototype.unselect = function(from, to, attrs) {
    var delta, delta_operations;
    if (typeof attrs === "string") {
      attrs = [attrs];
    }
    if (attrs.constructor !== Array) {
      throw new Error("Y.Selections.prototype.unselect expects an Array or String as the third parameter (attributes)!");
    }
    if (attrs.length <= 0) {
      return;
    }
    delta_operations = {
      from: from,
      to: to
    };
    delta = {
      attrs: attrs,
      type: "unselect"
    };
    return this._model.applyDelta(delta, delta_operations);
  };

  YSelections.prototype.getSelections = function(list) {
    var attrs, element, key, number_of_attrs, pos, result, sel_start, value, _ref;
    element = list.ref(0);
    if (element == null) {
      return [];
    }
    sel_start = null;
    pos = 0;
    result = [];
    while (element.next_cl != null) {
      if (element.isDeleted()) {
        if (element.selection != null) {
          console.log("You forgot to delete the selection from this operation! Please write an issue how to reproduce this bug! (it could lead to inconsistencies!)");
        }
        element = element.next_cl;
        continue;
      }
      if (element.selection != null) {
        if (element.selection.from === element) {
          if (sel_start != null) {
            throw new Error("Found two consecutive from elements. The selections are no longer safe to use! (contact the owner of the repository)");
          } else {
            sel_start = pos;
          }
        }
        if (element.selection.to === element) {
          if (sel_start != null) {
            number_of_attrs = 0;
            attrs = {};
            _ref = element.selection.attrs;
            for (key in _ref) {
              value = _ref[key];
              attrs[key] = value;
            }
            result.push({
              from: sel_start,
              to: pos,
              attrs: attrs
            });
            sel_start = null;
          } else {
            throw new Error("Found two consecutive to elements. The selections are no longer safe to use! (contact the owner of the repository)");
          }
        } else if (element.selection.from !== element) {
          throw new Error("This reference should not point to this selection, because the selection does not point to the reference. The selections are no longer safe to use! (contact the owner of the repository)");
        }
      }
      pos++;
      element = element.next_cl;
    }
    return result;
  };

  YSelections.prototype.observe = function(fun) {
    return this._listeners.push(fun);
  };

  YSelections.prototype.unobserve = function(fun) {
    return this._listeners = this._listeners.filter(function(otherFun) {
      return fun !== otherFun;
    });
  };

  return YSelections;

})();

if (typeof window !== "undefined" && window !== null) {
  if (window.Y != null) {
    window.Y.Selections = YSelections;
  } else {
    throw new Error("You must first import Y!");
  }
}

if (typeof module !== "undefined" && module !== null) {
  module.exports = YSelections;
}


},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NjYy9Eb2N1bWVudHMvcHJvZy9MaW5hZ29yYS95LXNlbGVjdGlvbnMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvY2NjL0RvY3VtZW50cy9wcm9nL0xpbmFnb3JhL3ktc2VsZWN0aW9ucy9saWIveS1zZWxlY3Rpb25zLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0NBLElBQUEsNEJBQUE7O0FBQUEsZUFBQSxHQUFrQixTQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsT0FBYixHQUFBO0FBQ2hCLE1BQUEsVUFBQTs7SUFENkIsVUFBUTtHQUNyQztBQUFBLE9BQUEsV0FBQTtzQkFBQTtBQUNFLElBQUEsSUFBRyxDQUFBLENBQUssbUJBQUEsSUFBZSxJQUFLLENBQUEsR0FBQSxDQUFMLEtBQWEsS0FBN0IsQ0FBUDtBQUNFLGFBQU8sS0FBUCxDQURGO0tBREY7QUFBQSxHQUFBO0FBR0EsRUFBQSxJQUFHLE9BQUg7V0FDRSxlQUFBLENBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBQTRCLEtBQTVCLEVBREY7R0FBQSxNQUFBO1dBR0UsS0FIRjtHQUpnQjtBQUFBLENBQWxCLENBQUE7O0FBQUE7QUFXZSxFQUFBLHFCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQUFBO0FBQUEsSUFDQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsRUFEdEIsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUhWLENBRFc7RUFBQSxDQUFiOztBQUFBLHdCQU1BLEtBQUEsR0FBTyxZQU5QLENBQUE7O0FBQUEsd0JBVUEsU0FBQSxHQUFXLFNBQUMsQ0FBRCxFQUFJLFNBQUosR0FBQTtBQUNULElBQUEsSUFBTyxtQkFBUDtBQUNFLE1BQUEsSUFBQyxDQUFBLE1BQUQsR0FBYyxJ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LENBVEE7QUFrREEsV0FBTyxNQUFQLENBbkRhO0VBQUEsQ0ExY2YsQ0FBQTs7QUFBQSx3QkFpZ0JBLE9BQUEsR0FBUyxTQUFDLEdBQUQsR0FBQTtXQUNQLElBQUMsQ0FBQSxVQUFVLENBQUMsSUFBWixDQUFpQixHQUFqQixFQURPO0VBQUEsQ0FqZ0JULENBQUE7O0FBQUEsd0JBc2dCQSxTQUFBLEdBQVcsU0FBQyxHQUFELEdBQUE7V0FDVCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixDQUFtQixTQUFDLFFBQUQsR0FBQTthQUMvQixHQUFBLEtBQU8sU0FEd0I7SUFBQSxDQUFuQixFQURMO0VBQUEsQ0F0Z0JYLENBQUE7O3FCQUFBOztJQVhGLENBQUE7O0FBc2hCQSxJQUFHLGdEQUFIO0FBQ0UsRUFBQSxJQUFHLGdCQUFIO0FBQ0UsSUFBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVQsR0FBc0IsV0FBdEIsQ0FERjtHQUFBLE1BQUE7QUFHRSxVQUFVLElBQUEsS0FBQSxDQUFNLDBCQUFOLENBQVYsQ0FIRjtHQURGO0NBdGhCQTs7QUE0aEJBLElBQUcsZ0RBQUg7QUFDRSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFdBQWpCLENBREY7Q0E1aEJBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMgY29tcGFyZSB0d28gb2JqZWN0IGZvciBlcXVhbGl0eSAobm8gZGVlcCBjaGVjayEpXG5jb21wYXJlX29iamVjdHMgPSAob2JqMSwgb2JqMiwgZG9BZ2Fpbj10cnVlKS0+XG4gIGZvciBrZXksIHZhbHVlIG9mIG9iajFcbiAgICBpZiBub3QgKG9iajJba2V5XT8gYW5kIG9iajJba2V5XSBpcyB2YWx1ZSlcbiAgICAgIHJldHVybiBmYWxzZVxuICBpZiBkb0FnYWluXG4gICAgY29tcGFyZV9vYmplY3RzKG9iajIsIG9iajEsIGZhbHNlKVxuICBlbHNlXG4gICAgdHJ1ZVxuXG5cbmNsYXNzIFlTZWxlY3Rpb25zXG4gIGNvbnN0cnVjdG9yOiAoKS0+XG4gICAgQF9saXN0ZW5lcnMgPSBbXVxuICAgIEBfY29tcG9zaXRpb25fdmFsdWUgPSBbXVxuICAgICMgd2UgcHV0IGFsbCB0aGUgbGlzdHMgd2UgdXNlIGluIHRoaXMgYXJyYXlcbiAgICBAX2xpc3RzID0gW11cblxuICBfbmFtZTogXCJTZWxlY3Rpb25zXCJcblxuICAjIEdldCB0aGUgeWpzIG1vZGVsIChjYWxsZWQgYnkgeWpzKVxuICAjIEByZXR1cm4gW01vZGVsXSByZXR1cm4gdGhlIG1vZGVsXG4gIF9nZXRNb2RlbDogKFksIE9wZXJhdGlvbikgLT5cbiAgICBpZiBub3QgQF9tb2RlbD9cbiAgICAgIEBfbW9kZWwgPSBuZXcgT3BlcmF0aW9uLkNvbXBvc2l0aW9uKEAsIFtdKS5leGVjdXRlKClcbiAgICBAX21vZGVsXG5cbiAgIyBTZXQgdGhlIHlqcyBtb2RlbCAoY2FsbGVkIGJ5IHlqcylcbiAgIyBAcGFyYW0gbW9kZWwgW01vZGVsXSB0aGUgbW9kZWwgdG8gc2V0XG4gIF9zZXRNb2RlbDogKEBfbW9kZWwpLT5cblxuICAjID8/P1xuICAjIEByZXR1cm4gW09iamVjdF0gYW4gb2JqZWN0IC5jb21wb3NpdGlvbl92YWx1ZSBhbmQgLmNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNcbiAgX2dldENvbXBvc2l0aW9uVmFsdWU6ICgpLT5cbiAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zID0ge31cbiAgICBjb21wb3NpdGlvbl92YWx1ZSA9IGZvciB2YWx1ZSwgaW5kZXggaW4gQF9jb21wb3NpdGlvbl92YWx1ZVxuICAgICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9uc1tcIlwiK2luZGV4K1wiL2Zyb21cIl0gPSB2YWx1ZS5mcm9tXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zW1wiXCIraW5kZXgrXCIvdG9cIl0gPSB2YWx1ZS50b1xuICAgICAge1xuICAgICAgICBhdHRyczogdmFsdWUuYXR0cnNcbiAgICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb21wb3NpdGlvbl92YWx1ZSA6IGNvbXBvc2l0aW9uX3ZhbHVlXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zOiBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zXG4gICAgfVxuXG4gICMgPz8/XG4gIF9zZXRDb21wb3NpdGlvblZhbHVlOiAoY29tcG9zaXRpb25fdmFsdWUpLT5cbiAgICBmb3IgdmFsdWUgaW4gY29tcG9zaXRpb25fdmFsdWVcbiAgICAgIHZhbHVlLnR5cGUgPSBcInNlbGVjdFwiXG4gICAgICBAX2FwcGx5IHZhbHVlXG5cbiAgIyBBcHBseSBhIGRlbHRhXG4gICMgQHBhcmFtIGRlbHRhIFtPYmplY3RdIHRoZSBkZWx0YSB0byBhcHBseVxuICAjIEBvcHRpb24gZGVsdGEgW1kuTGlzdCBpdGVtXSBmcm9tIHRoZSBzdGFydCBvZiB0aGUgZGVsdGFcbiAgIyBAb3B0aW9uIGRlbHRhIFtZLkxpc3QgaXRlbV0gdG8gdGhlIGVuZCBvZiB0aGUgZGVsdGFcbiAgIyBAb3B0aW9uIGRlbHRhIFtTdHJpbmddIHR5cGUgZWl0aGVyIFwic2VsZWN0XCIgb3IgXCJ1bnNlbGVjdFwiXG4gIF9hcHBseTogKGRlbHRhKS0+XG4gICAgdW5kb3MgPSBbXSAjIGxpc3Qgb2YgZGVsdGFzIHRoYXQgYXJlIG5lY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2VcblxuICAgIGlmIGRlbHRhLmZyb20uaXNEZWxldGVkKClcbiAgICAgIGRlbHRhLmZyb20gPSBkZWx0YS5mcm9tLmdldE5leHQoKVxuICAgIGlmIGRlbHRhLnRvLmlzRGVsZXRlZCgpXG4gICAgICBkZWx0YS50byA9IGRlbHRhLnRvLmdldFByZXYoKVxuXG4gICAgZnJvbSA9IGRlbHRhLmZyb21cbiAgICB0byA9IGRlbHRhLnRvXG4gICAgaWYgZnJvbS5nZXRQcmV2KCkgaXMgdG9cbiAgICAgICMgVGhlcmUgaXMgbm90aGluZyB0byBzZWxlY3QgYW55bW9yZSFcbiAgICAgIHJldHVybiB1bmRvc1xuXG5cbiAgICAjXG4gICAgIyBBc3N1bWluZyAkZnJvbSBpcyBkZWxldGVkIGF0IHNvbWUgcG9pbnQuIFdlIG5lZWQgdG8gY2hhbmdlIHRoZSBzZWxlY3Rpb25cbiAgICAjIF9iZWZvcmVfIHRoZSBHQyByZW1vdmVzIGl0IGNvbXBsZXRlbHkgZnJvbSB0aGUgbGlzdC4gVGhlcmVmb3JlLCB3ZSBsaXN0ZW4gdG9cbiAgICAjIFwiZGVsZXRlXCIgZXZlbnRzLCBhbmQgaWYgdGhhdCBwYXJ0aWN1bGFyIG9wZXJhdGlvbiBoYXMgYSBzZWxlY3Rpb25cbiAgICAjIChvLnNzZWxlY3Rpb24/KSB3ZSBtb3ZlIHRoZSBzZWxlY3Rpb24gdG8gdGhlIG5leHQgdW5kZWxldGVkIG9wZXJhdGlvbiwgaWZcbiAgICAjIGFueS4gSXQgYWxzbyBoYW5kbGVzIHRoZSBjYXNlIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBzZWxlY3QgYW55bW9yZSAoZS5nLlxuICAgICMgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHNlbGVjdGlvbiBpcyBkZWxldGVkKS4gVGhlbiB3ZSByZW1vdmUgdGhlIHNlbGVjdGlvblxuICAgICMgY29tcGxldGVseVxuICAgICNcbiAgICAjIGlmIG5ldmVyIGFwcGxpZWQgYSBkZWx0YSBvbiB0aGlzIGxpc3QsIGFkZCBhIGxpc3RlbmVyIHRvIGl0IGluIG9yZGVyIHRvXG4gICAgIyBjaGFuZ2Ugc2VsZWN0aW9ucyBpZiBuZWNlc3NhcnlcbiAgICBpZiBkZWx0YS50eXBlIGlzIFwic2VsZWN0XCJcbiAgICAgIHBhcmVudCA9IGZyb20uZ2V0UGFyZW50KClcbiAgICAgIHBhcmVudF9leGlzdHMgPSBmYWxzZVxuICAgICAgZm9yIHAgaW4gQF9saXN0c1xuICAgICAgICBpZiBwYXJlbnQgaXMgQF9saXN0c1twXVxuICAgICAgICAgIHBhcmVudF9leGlzdHMgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgIGlmIG5vdCBwYXJlbnRfZXhpc3RzXG4gICAgICAgIEBfbGlzdHMucHVzaCBwYXJlbnRcbiAgICAgICAgcGFyZW50Lm9ic2VydmUgKGV2ZW50cykgPT5cbiAgICAgICAgICBmb3IgZXZlbnQgaW4gZXZlbnRzXG4gICAgICAgICAgICBpZiBldmVudC50eXBlIGlzIFwiZGVsZXRlXCJcbiAgICAgICAgICAgICAgaWYgZXZlbnQucmVmZXJlbmNlLnNlbGVjdGlvbj9cbiAgICAgICAgICAgICAgICByZWYgPSBldmVudC5yZWZlcmVuY2VcbiAgICAgICAgICAgICAgICBzZWwgPSByZWYuc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgIyBkZWxldGUgaXQsIGJlY2F1c2UgcmVmIGlzIGdvaW5nIHRvIGdldCBkZWxldGVkIVxuICAgICAgICAgICAgICAgIGRlbGV0ZSByZWYuc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgIyBpZiB0aGUgc2VsZWN0aW9uIGlzIDAtbGVuZ3RoXG4gICAgICAgICAgICAgICAgaWYgc2VsLmZyb20gaXMgcmVmIGFuZCBzZWwudG8gaXMgcmVmXG4gICAgICAgICAgICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIHNlbFxuICAgICAgICAgICAgICAgICMgaWYgdGhlIHNlbGVjdGlvbiBzdGFydGVkIGhlcmUsIG1vdmUgaXQgdG8gbmV4dCBlbGVtZW50XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzZWwuZnJvbSBpcyByZWZcbiAgICAgICAgICAgICAgICAgIG5leHQgPSByZWYuZ2V0TmV4dCgpXG4gICAgICAgICAgICAgICAgICBzZWwuZnJvbSA9IG5leHRcbiAgICAgICAgICAgICAgICAgIG5leHQuc2VsZWN0aW9uID0gc2VsXG4gICAgICAgICAgICAgICAgIyBpZiB0aGUgc2VsZWN0aW9uIGVuZHMgaGVyZSwgbW92ZSBpdCB0byBwcmV2aW91cyBlbGVtZW50XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzZWwudG8gaXMgcmVmXG4gICAgICAgICAgICAgICAgICBwcmV2ID0gcmVmLmdldFByZXYoKVxuICAgICAgICAgICAgICAgICAgc2VsLnRvID0gcHJldlxuICAgICAgICAgICAgICAgICAgcHJldi5zZWxlY3Rpb24gPSBzZWxcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB3ZWlyZCBpbmNvbnNpc3RlbmN5ISBZLlNlbGVjdGlvbnMgaXNcbiAgICAgICAgICAgICAgICAgICAgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlIVwiXG4gICAgICAgICAgICAgIG5leHQgPSBldmVudC5yZWZlcmVuY2UuZ2V0TmV4dCgpXG4gICAgICAgICAgICAgIGlmIG5leHQuc2VsZWN0aW9uP1xuICAgICAgICAgICAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBuZXh0LnNlbGVjdGlvblxuXG4gICAgIyBub3RpZnkgbGlzdGVuZXJzOlxuICAgIG9ic2VydmVyX2NhbGwgPVxuICAgICAgZnJvbTogIGZyb21cbiAgICAgIHRvOiAgICB0b1xuICAgICAgdHlwZTogIGRlbHRhLnR5cGVcbiAgICAgIGF0dHJzOiBkZWx0YS5hdHRyc1xuICAgIGZvciBsaXN0ZW5lciBpbiBAX2xpc3RlbmVyc1xuICAgICAgbGlzdGVuZXIuY2FsbCB0aGlzLCBvYnNlcnZlcl9jYWxsXG5cbiAgICAjIGNyZWF0ZSBhIG5ldyBzZWxlY3Rpb24gYW5kIGFkZCBpdCB0byB0aGUgc3RhY2sgb2YgY29tcG9zaXRpb24gdmFsdWVzXG4gICAgY3JlYXRlU2VsZWN0aW9uID0gKGZyb20sIHRvLCBhdHRycyk9PlxuICAgICAgbmV3X2F0dHJzID0ge31cbiAgICAgIGZvciBrZXksdmFsdWUgb2YgYXR0cnNcbiAgICAgICAgbmV3X2F0dHJzW2tleV0gPSB2YWx1ZVxuICAgICAgbmV3X3NlbCA9XG4gICAgICAgIGZyb206ICBmcm9tXG4gICAgICAgIHRvOiAgICB0b1xuICAgICAgICBhdHRyczogbmV3X2F0dHJzXG4gICAgICBAX2NvbXBvc2l0aW9uX3ZhbHVlLnB1c2ggbmV3X3NlbFxuICAgICAgbmV3X3NlbFxuXG4gICAgIyBpcyBleHRlbmQgdGhlIHJpZ2h0IG5hbWU/XG4gICAgZXh0ZW5kU2VsZWN0aW9uID0gKHNlbGVjdGlvbiktPlxuICAgICAgIyByZW1vdmUgdGhlIGF0dHJpYnV0ZXMgZnJvbSB0aGUgc2VsZWN0aW9uXG4gICAgICBpZiBkZWx0YS50eXBlIGlzIFwidW5zZWxlY3RcIlxuICAgICAgICB1bmRvX2F0dHJzID0ge31cbiAgICAgICAgZm9yIGtleSBpbiBkZWx0YS5hdHRyc1xuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1trZXldP1xuICAgICAgICAgICAgdW5kb19hdHRyc1trZXldID0gc2VsZWN0aW9uLmF0dHJzW2tleV1cbiAgICAgICAgICBkZWxldGUgc2VsZWN0aW9uLmF0dHJzW2tleV1cbiAgICAgICAgIyBhZGQgdGhlIG9wZXJhdGlvbiB0byByZWNyZWF0ZSBpdFxuICAgICAgICB1bmRvcy5wdXNoXG4gICAgICAgICAgZnJvbTogIGRlbHRhLmZyb21cbiAgICAgICAgICB0bzogICAgZGVsdGEudG9cbiAgICAgICAgICBhdHRyczogdW5kb19hdHRyc1xuICAgICAgICAgIHR5cGU6ICBcInNlbGVjdFwiXG4gICAgICBlbHNlXG4gICAgICAgIHVuZG9fYXR0cnMgPSB7fSAjIGZvciB1bmRvIHNlbGVjdGlvbiAob3ZlcndyaXRlIG9mIGV4aXN0aW5nIHNlbGVjdGlvbilcbiAgICAgICAgdW5kb19hdHRyc19saXN0ID0gW10gIyBmb3IgdW5kbyBzZWxlY3Rpb24gKG5vdCBvdmVyd3JpdGUpXG4gICAgICAgIHVuZG9fbmVlZF91bnNlbGVjdCA9IGZhbHNlXG4gICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSBmYWxzZVxuICAgICAgICBpZiBkZWx0YS5vdmVyd3JpdGU/IGFuZCBkZWx0YS5vdmVyd3JpdGVcbiAgICAgICAgICAjIG92ZXJ3cml0ZSBldmVyeXRoaW5nIHRoYXQgdGhlIGRlbHRhIGRvZXNuJ3QgZXhwZWN0XG4gICAgICAgICAgZm9yIGtleSwgdmFsdWUgb2Ygc2VsZWN0aW9uLmF0dHJzXG4gICAgICAgICAgICBpZiBub3QgZGVsdGEuYXR0cnNbbl0/XG4gICAgICAgICAgICAgIHVuZG9fbmVlZF9zZWxlY3QgPSB0cnVlXG4gICAgICAgICAgICAgIHVuZG9fYXR0cnNba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICMgbXVzdCBub3QgZGVsZXRlIGF0dHJpYnV0ZXMgb2YgJHNlbGVjdGlvbi5hdHRycyBpbiB0aGlzIGxvb3AsXG4gICAgICAgICAgICAgICMgc28gd2UgZG8gaXQgaW4gdGhlIG5leHQgb25lXG4gICAgICAgICAgZm9yIG4sdiBvZiB1bmRvX2F0dHJzXG4gICAgICAgICAgICBkZWxldGUgc2VsZWN0aW9uLmF0dHJzW2tleV1cblxuICAgICAgICAjIGFwcGx5IHRoZSBkZWx0YSBvbiB0aGUgc2VsZWN0aW9uXG4gICAgICAgIGZvciBrZXksIHZhbHVlIG9mIGRlbHRhLmF0dHJzXG4gICAgICAgICAgaWYgc2VsZWN0aW9uLmF0dHJzW2tleV0/XG4gICAgICAgICAgICB1bmRvX2F0dHJzW2tleV0gPSBzZWxlY3Rpb24uYXR0cnNba2V5XVxuICAgICAgICAgICAgdW5kb19uZWVkX3NlbGVjdCA9IHRydWVcbiAgICAgICAgICAjIGlmIGtleSBub3QgYWxyZWFkeSBkZWZpbmVkIHJldmVyc2luZyBpdCBpcyBsaWtlIHVuc2VsZWN0aW5nIGl0XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdW5kb19hdHRyc19saXN0LnB1c2gga2V5XG4gICAgICAgICAgICB1bmRvX25lZWRfdW5zZWxlY3QgPSB0cnVlXG4gICAgICAgICAgc2VsZWN0aW9uLmF0dHJzW2tleV0gPSB2YWx1ZVxuICAgICAgICAjIHB1c2ggYWxsIHRoZSB1bmRvcyB0byAkdW5kb3NcbiAgICAgICAgaWYgdW5kb19uZWVkX3NlbGVjdFxuICAgICAgICAgIHVuZG9zLnB1c2hcbiAgICAgICAgICAgIGZyb206ICBzZWxlY3Rpb24uZnJvbVxuICAgICAgICAgICAgdG86ICAgIHNlbGVjdGlvbi50b1xuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcbiAgICAgICAgICAgIHR5cGU6ICBcInNlbGVjdFwiXG4gICAgICAgIGlmIHVuZG9fbmVlZF91bnNlbGVjdFxuICAgICAgICAgIHVuZG9zLnB1c2hcbiAgICAgICAgICAgIGZyb206ICBzZWxlY3Rpb24uZnJvbVxuICAgICAgICAgICAgdG86ICAgIHNlbGVjdGlvbi50b1xuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNfbGlzdFxuICAgICAgICAgICAgdHlwZTogIFwidW5zZWxlY3RcIlxuXG4gICAgIyBBbGdvcml0aG0gb3ZlcnZpZXc6XG4gICAgIyAxLiBjdXQgb2ZmIHRoZSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggZnJvbVxuICAgICMgMi4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIHRvXG4gICAgIyAzLiBleHRlbmQgLyBhZGQgc2VsZWN0aW9ucyBpbiBiZXR3ZWVuXG4gICAgI1xuICAgICMjIyMgMS4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIGZyb21cbiAgICAjXG4gICAgY3V0X29mZl9mcm9tID0gKCktPlxuICAgICAgIyBjaGVjayBpZiBhIHNlbGVjdGlvbiAodG8gdGhlIGxlZnQgb2YgJGZyb20pIGludGVyc2VjdHMgd2l0aCAkZnJvbVxuICAgICAgaWYgZnJvbS5zZWxlY3Rpb24/IGFuZCBmcm9tLnNlbGVjdGlvbi5mcm9tIGlzIGZyb21cbiAgICAgICAgIyBkb2VzIG5vdCBpbnRlcnNlY3QsIGJlY2F1c2UgdGhlIHN0YXJ0IGlzIGFscmVhZHkgc2VsZWN0ZWRcbiAgICAgICAgcmV0dXJuXG4gICAgICAjIGZpbmQgZmlyc3QgZWxlbWVudCB0aGF0IGhhcyBhIGRlbGltaXRlciAoYW5kIHN0b3AgaWYgaXRzIGEgZGVsaW1pdGVyLFxuICAgICAgIyBhLmsuYSB0aGUgZW5kIG9mIHRoZSBsaXN0KVxuICAgICAgZWxlbWVudCA9IGZyb20ucHJldl9jbFxuICAgICAgd2hpbGUgKG5vdCBlbGVtZW50LnNlbGVjdGlvbj8pIGFuZCAoZWxlbWVudC50eXBlIGlzbnQgXCJEZWxpbWl0ZXJcIilcbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucHJldl9jbFxuICAgICAgIyBpZiB0aGUgZWxlbWVudCBoYXMgbm8gc2VsZWN0aW9uIChsb29wZWQgYWxsIG92ZXIgdGhlIGxpc3QpXG4gICAgICAjIG9yIGlzIGFuICplbmRwb2ludCogb2YgYSBzZWxlY3Rpb24sIHRoZXJlIGlzIG5vIGludGVyc2VjdGlvblxuICAgICAgaWYgKG5vdCBlbGVtZW50LnNlbGVjdGlvbj8pIG9yIGVsZW1lbnQuc2VsZWN0aW9uLnRvIGlzIGVsZW1lbnRcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgICMgV2UgZm91bmQgYSBzZWxlY3Rpb24gdGhhdCBpbnRlcnNlY3RzIHdpdGggJGZyb20uXG4gICAgICAjIE5vdyB3ZSBoYXZlIHRvIGNoZWNrIGlmIGl0IGFsc28gaW50ZXJzZWN0cyB3aXRoICR0by5cbiAgICAgICMgVGhlbiB3ZSBjdXQgaXQgaW4gc3VjaCBhIHdheSwgdGhhdCB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IGludGVyc2VjdFxuICAgICAgIyB3aXRoICRmcm9tIGFuZCAkdG8gYW55bW9yZS5cblxuICAgICAgIyB0aGlzIGlzIGEgcmVmZXJlbmNlIGZvciB0aGUgc2VsZWN0aW9ucyB0aGF0IGFyZSBjcmVhdGVkL21vZGlmaWVkOlxuICAgICAgIyBvbGRfc2VsZWN0aW9uIGlzIG91dGVyIChub3QgYmV0d2VlbiAkZnJvbSAkdG8pXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICRmcm9tXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgaW5uZXIgKGluYmV0d2VlbiAkZnJvbSAkdG8pXG4gICAgICAjICAgLSBjcmVhdGVkLCByaWdodCBhZnRlciAkZnJvbVxuICAgICAgIyBvcHRfc2VsZWN0aW9uIGlzIG91dGVyIChhZnRlciAkdG8pXG4gICAgICAjICAgLSBjcmVhdGVkIChpZiBuZWNlc3NhcnkpLCByaWdodCBhZnRlciAkdG9cbiAgICAgIG9sZF9zZWxlY3Rpb24gPSBlbGVtZW50LnNlbGVjdGlvblxuXG4gICAgICAjIGNoZWNrIGlmIGZvdW5kIHNlbGVjdGlvbiBhbHNvIGludGVyc2VjdHMgd2l0aCAkdG9cbiAgICAgICMgKiBzdGFydGluZyBmcm9tICRmcm9tLCBnbyB0byB0aGUgcmlnaHQgdW50aWwgeW91IGZvdW5kIGVpdGhlciAkdG8gb3Igb2xkX3NlbGVjdGlvbi50b1xuICAgICAgIyAqKiBpZiAkdG86IG5vIGludGVyc2VjdGlvbiB3aXRoICR0b1xuICAgICAgIyAqKiBpZiAkb2xkX3NlbGVjdGlvbi50bzogaW50ZXJzZWN0aW9uIHdpdGggJHRvIVxuICAgICAgZWxlbWVudCA9IGZyb21cbiAgICAgIHdoaWxlIChlbGVtZW50IGlzbnQgb2xkX3NlbGVjdGlvbi50bykgYW5kIChlbGVtZW50IGlzbnQgdG8pXG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50LmdldE5leHQoKVxuXG4gICAgICBpZiBlbGVtZW50IGlzIG9sZF9zZWxlY3Rpb24udG9cbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb24gd2l0aCB0byFcbiAgICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cbiAgICAgICAgbmV3X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBmcm9tLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXG5cbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvID0gZnJvbS5nZXRQcmV2KClcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cblxuICAgICAgICAjIHNldCByZWZlcmVuY2VzIG9mIG5ld19zZWxlY3Rpb25cbiAgICAgICAgbmV3X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cbiAgICAgICAgbmV3X3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG4gICAgICBlbHNlXG4gICAgICAgICMgdGhlcmUgaXMgYW4gaW50ZXJzZWN0aW9uIHdpdGggdG8hXG5cbiAgICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cbiAgICAgICAgbmV3X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBmcm9tLCB0bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xuXG4gICAgICAgICMgY3JlYXRlICRvcHRfc2VsZWN0aW9uXG4gICAgICAgIG9wdF9zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gdG8uZ2V0TmV4dCgpLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXG5cbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvID0gZnJvbS5nZXRQcmV2KClcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cblxuICAgICAgICBvcHRfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gb3B0X3NlbGVjdGlvblxuICAgICAgICBvcHRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9wdF9zZWxlY3Rpb25cblxuICAgICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxuICAgICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cblxuXG4gICAgY3V0X29mZl9mcm9tKClcblxuICAgICMgMi4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoICR0b1xuICAgIGN1dF9vZmZfdG8gPSAoKS0+XG4gICAgICAjIGNoZWNrIGlmIGEgc2VsZWN0aW9uICh0byB0aGUgbGVmdCBvZiAkdG8pIGludGVyc2VjdHMgd2l0aCAkdG9cbiAgICAgIGlmIHRvLnNlbGVjdGlvbj8gYW5kIHRvLnNlbGVjdGlvbi50byBpcyB0b1xuICAgICAgICAjIGRvZXMgbm90IGludGVyc2VjdCwgYmVjYXVzZSB0aGUgZW5kIGlzIGFscmVhZHkgc2VsZWN0ZWRcbiAgICAgICAgcmV0dXJuXG4gICAgICAjIGZpbmQgZmlyc3Qgc2VsZWN0aW9uIHRvIHRoZSBsZWZ0XG4gICAgICBlbGVtZW50ID0gdG9cbiAgICAgIHdoaWxlIChub3QgZWxlbWVudC5zZWxlY3Rpb24/KSBhbmQgKGVsZW1lbnQgaXNudCBmcm9tKVxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5nZXRQcmV2KClcbiAgICAgIGlmIChub3QgZWxlbWVudC5zZWxlY3Rpb24/KSBvciBlbGVtZW50LnNlbGVjdGlvbltcInRvXCJdIGlzIGVsZW1lbnRcbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb25cbiAgICAgICAgcmV0dXJuXG4gICAgICAjIFdlIGZvdW5kIGEgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoICR0by5cbiAgICAgICMgTm93IHdlIGhhdmUgdG8gY3V0IGl0IGluIHN1Y2ggYSB3YXkgdGhhdCB0aGUgc2VsZWN0aW9uIGRvZXMgbm90XG4gICAgICAjIGludGVyc2VjdCB3aXRoICR0byBhbnltb3JlLlxuXG4gICAgICAjIHRoaXMgaXMgYSByZWZlcmVuY2UgZm9yIHRoZSBzZWxlY3Rpb25zIHRoYXQgYXJlIGNyZWF0ZWQvbW9kaWZpZWQ6XG4gICAgICAjIGl0IGlzIHNpbWlsYXIgdG8gdGhlIG9uZSBhYm92ZSwgZXhjZXB0IHRoYXQgd2UgZG8gbm90IG5lZWQgb3B0X3NlbGVjdGlvblxuICAgICAgIyBhbnltb3JlIVxuICAgICAgIyBvbGRfc2VsZWN0aW9uIGlzIGlubmVyIChiZXR3ZWVuICRmcm9tIGFuZCAkdG8pXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICR0b1xuICAgICAgIyBuZXdfc2VsZWN0aW9uIGlzIG91dGVyICggb3V0ZXIgJGZyb20gYW5kICR0bylcbiAgICAgICMgICAtIGNyZWF0ZWQsIHJpZ2h0IGFmdGVyICR0b1xuXG4gICAgICBvbGRfc2VsZWN0aW9uID0gZWxlbWVudC5zZWxlY3Rpb25cblxuICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cbiAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gdG8uZ2V0TmV4dCgpLCBvbGRfc2VsZWN0aW9uLnRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXG5cbiAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXNcbiAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSB0b1xuICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxuICAgICAgb2xkX3NlbGVjdGlvbi50by5zZWxlY3Rpb24gPSBvbGRfc2VsZWN0aW9uXG5cbiAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXG4gICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cblxuICAgIGN1dF9vZmZfdG8oKVxuXG4gICAgZGVsdGFfaGFzX2F0dHJzID0gZmFsc2VcbiAgICBmb3IgYSBvZiBkZWx0YS5hdHRyc1xuICAgICAgZGVsdGFfaGFzX2F0dHJzID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluIGJldHdlZW5cbiAgICBlbGVtID0gZnJvbVxuICAgIHRvX25leHQgPSB0by5nZXROZXh0KClcbiAgICAjIGxvb3AgaW4gdGhlIHNlbGVjdGlvbiBkZWxpbWl0ZWQgYnkgdGhlIGRlbHRhXG4gICAgd2hpbGUgKGVsZW0gaXNudCB0b19uZXh0KVxuICAgICAgaWYgZWxlbS5zZWxlY3Rpb24/XG4gICAgICAgICMganVzdCBleHRlbmQgdGhlIGV4aXN0aW5nIHNlbGVjdGlvblxuICAgICAgICBleHRlbmRTZWxlY3Rpb24gZWxlbS5zZWxlY3Rpb24sIGRlbHRhICMgd2lsbCBwdXNoIHVuZG8tZGVsdGFzIHRvICR1bmRvc1xuICAgICAgICBzZWxlY3Rpb24gPSBlbGVtLnNlbGVjdGlvblxuICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgc2VsZWN0aW9uXG5cbiAgICAgICAgZWxlbSA9IHNlbGVjdGlvbi50by5nZXROZXh0KClcbiAgICAgICAgc2VsZWN0aW9uX2lzX2VtcHR5ID0gdHJ1ZVxuICAgICAgICBmb3IgYXR0ciBvZiBzZWxlY3Rpb24uYXR0cnNcbiAgICAgICAgICBzZWxlY3Rpb25faXNfZW1wdHkgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGlmIHNlbGVjdGlvbl9pc19lbXB0eVxuICAgICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgc2VsZWN0aW9uXG4gICAgICBlbHNlXG4gICAgICAgICMgY3JlYXRlIGEgbmV3IHNlbGVjdGlvbiAodW50aWwgeW91IGZpbmQgdGhlIG5leHQgb25lKVxuICAgICAgICBzdGFydCA9IGVsZW1cbiAgICAgICAgZWxlbV9uZXh0ID0gZWxlbS5nZXROZXh0KClcbiAgICAgICAgd2hpbGUgKG5vdCBlbGVtX25leHQuc2VsZWN0aW9uPykgYW5kIChlbGVtIGlzbnQgdG8pXG4gICAgICAgICAgZWxlbSA9IGVsZW1fbmV4dFxuICAgICAgICAgIGVsZW1fbmV4dCA9IGVsZW0uZ2V0TmV4dCgpXG4gICAgICAgIGVuZCA9IGVsZW1cbiAgICAgICAgaWYgZGVsdGEudHlwZSBpc250IFwidW5zZWxlY3RcIiBhbmQgZGVsdGFfaGFzX2F0dHJzXG4gICAgICAgICAgYXR0cl9saXN0ID0gW11cbiAgICAgICAgICBmb3Igbix2IG9mIGRlbHRhLmF0dHJzXG4gICAgICAgICAgICBhdHRyX2xpc3QucHVzaCBuXG4gICAgICAgICAgdW5kb3MucHVzaFxuICAgICAgICAgICAgZnJvbTogc3RhcnRcbiAgICAgICAgICAgIHRvOiBlbmRcbiAgICAgICAgICAgIGF0dHJzOiBhdHRyX2xpc3RcbiAgICAgICAgICAgIHR5cGU6IFwidW5zZWxlY3RcIlxuICAgICAgICAgIHNlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiBzdGFydCwgZW5kLCBkZWx0YS5hdHRyc1xuICAgICAgICAgIHN0YXJ0LnNlbGVjdGlvbiA9IHNlbGVjdGlvblxuICAgICAgICAgIGVuZC5zZWxlY3Rpb24gPSBzZWxlY3Rpb25cbiAgICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgZWxlbS5zZWxlY3Rpb25cbiAgICAgICAgZWxlbSA9IGVsZW0uZ2V0TmV4dCgpXG5cbiAgICAjIGFuZCBjaGVjayBpZiB5b3UgY2FuIGNvbWJpbmUgaXRcbiAgICBpZiBlbGVtLnNlbGVjdGlvbj9cbiAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBlbGVtLnNlbGVjdGlvblxuICAgICMgYWxzbyByZS1jb25uZWN0IGZyb21cbiAgICBpZiBmcm9tLnNlbGVjdGlvbj9cbiAgICAgIEBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdCBmcm9tLnNlbGVjdGlvblxuXG4gICAgcmV0dXJuIHVuZG9zICMgaXQgaXMgbmVjZXNzYXJ5IHRoYXQgZGVsdGEgaXMgcmV0dXJuZWQgaW4gdGhlIHdheSBpdCB3YXMgYXBwbGllZCBvbiB0aGUgZ2xvYmFsIGRlbHRhLlxuICAgICMgc28gdGhhdCB5anMga25vd3MgZXhhY3RseSB3aGF0IHdhcyBhcHBsaWVkIChhbmQgaG93IHRvIHVuZG8gaXQpLlxuXG4gICMgPz8/XG4gIF9yZW1vdmVGcm9tQ29tcG9zaXRpb25WYWx1ZTogKHNlbGVjdGlvblRvUmVtb3ZlKS0+XG4gICAgQF9jb21wb3NpdGlvbl92YWx1ZSA9IEBfY29tcG9zaXRpb25fdmFsdWUuZmlsdGVyIChzZWwpLT5cbiAgICAgIHNlbCBpc250IHNlbGVjdGlvblRvUmVtb3ZlXG4gICAgZGVsZXRlIHNlbGVjdGlvblRvUmVtb3ZlLmZyb20uc2VsZWN0aW9uXG4gICAgZGVsZXRlIHNlbGVjdGlvblRvUmVtb3ZlLnRvLnNlbGVjdGlvblxuXG4gICMgVHJ5IHRvIGNvbWJpbmUgYSBzZWxlY3Rpb24gdG8gdGhlIHNlbGVjdGlvbiB0byBpdHMgbGVmdCAoaWYgYW55KVxuICAjIEBwYXJhbSBbT3B0aW9uXSBzZWxlY3Rpb24gdGhlIHNlbGVjdGlvbiB0byB0cnkgdG8gY29tYmluZVxuICAjIEBwYXJhbSBzZWxlY3Rpb24gW1kuTGlzdCBpdGVtXSBmcm9tIHRoZSBzdGFydCBvZiB0aGUgc2VsZWN0aW9uXG4gICMgQHBhcmFtIHNlbGVjdGlvbiBbWS5MaXN0IGl0ZW1dIHRvIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvblxuICAjIEBwYXJhbSBzZWxlY3Rpb24gW09iamVjdF0gYXR0cnMgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIHNlbGVjdGlvblxuICBfY29tYmluZV9zZWxlY3Rpb25fdG9fbGVmdDogKHNlbCktPlxuICAgIGZpcnN0X2VsZW0gPSBzZWwuZnJvbS5nZXRQcmV2KClcbiAgICBpZiBub3QgZmlyc3RfZWxlbS5zZWxlY3Rpb24/XG4gICAgICAjIHRoZXJlIGlzIG5vIHNlbGVjdGlvbiB0byB0aGUgbGVmdFxuICAgICAgcmV0dXJuXG4gICAgZWxzZVxuICAgICAgIyBpZiB0aGV5IGhhdmUgdGhlIHNhbWVzIGF0dHJpYnV0ZXMsIG1lcmdlIHRoZW1cbiAgICAgIGlmIGNvbXBhcmVfb2JqZWN0cyhmaXJzdF9vLnNlbGVjdGlvbi5hdHRycywgc2VsLmF0dHJzKVxuICAgICAgICAjIHdlIGFyZSBnb2luZyB0byByZW1vdmUgdGhlIGxlZnQgc2VsZWN0aW9uXG4gICAgICAgICMgRmlyc3QsIHJlbW92ZSBldmVyeSB0cmFjZSBvZiBmaXJzdF9vLnNlbGVjdGlvbiAoc2F2ZSB3aGF0IGlzIG5lY2Vzc2FyeSlcbiAgICAgICAgIyBUaGVuLCByZS1zZXQgc2VsLmZyb21cbiAgICAgICAgbmV3X2Zyb20gPSBmaXJzdF9vLnNlbGVjdGlvbi5mcm9tXG4gICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgZmlyc3Rfby5zZWxlY3Rpb25cblxuICAgICAgICAjIGRlbGV0ZSBvbGQgc2VsZWN0aW9uXG4gICAgICAgIGlmIHNlbC5mcm9tIGlzbnQgc2VsLnRvXG4gICAgICAgICAgZGVsZXRlIHNlbC5mcm9tLnNlbGVjdGlvblxuXG4gICAgICAgICMgYmluZCBuZXcgc2VsZWN0aW9uXG4gICAgICAgIHNlbC5mcm9tID0gbmV3X2Zyb21cbiAgICAgICAgbmV3X2Zyb20uc2VsZWN0aW9uID0gc2VsXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVyblxuXG4gICMgQXBwbHkgdW5kb2luZyBkZWx0YXMgKGRvZXMgdGhlIHNhbWUgYXMgX2FwcGx5KVxuICAjIEBwYXJhbSBkZWx0YXMgW0FycmF5PERlbHRhPl0gdGhlIGRlbHRhcyB0byB1bmFwcGx5XG4gIF91bmFwcGx5OiAoZGVsdGFzKS0+XG4gICAgIyBfYXBwbHkgcmV0dXJucyBhIF9saXN0XyBvZiBkZWx0YXMsIHRoYXQgYXJlIG5lY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2UuXG4gICAgIyBOb3cgd2UgX2FwcGx5IGV2ZXJ5IGRlbHRhIGluIHRoZSBsaXN0IChhbmQgZGlzY2FyZCB0aGUgcmVzdWx0cylcbiAgICBmb3IgZGVsdGEgaW4gZGVsdGFzXG4gICAgICBAX2FwcGx5IGRlbHRhXG4gICAgcmV0dXJuXG5cbiAgIyBzZWxlY3QgX2Zyb21fIF90b18gd2l0aCBhbiBfYXR0cmlidXRlX1xuICAjIEBwYXJhbSBmcm9tIFtZLkxpc3QgaXRlbV0gdGhlIHN0YXJ0IG9mIHRoZSBzZWxlY3Rpb25cbiAgIyBAcGFyYW0gdG8gW1kuTGlzdCBpdGVtXSB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb25cbiAgIyBAcGFyYW0gYXR0cnMgW09iamVjdF0gdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIHNlbGVjdGlvblxuICBzZWxlY3Q6IChmcm9tLCB0bywgYXR0cnMsIG92ZXJ3cml0ZSktPlxuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgYSBvZiBhdHRyc1xuICAgICAgbGVuZ3RoKytcbiAgICAgIGJyZWFrXG4gICAgaWYgbGVuZ3RoIDw9IDAgYW5kIG5vdCAob3ZlcndyaXRlPyBhbmQgb3ZlcndyaXRlKVxuICAgICAgcmV0dXJuXG5cbiAgICBkZWx0YV9vcGVyYXRpb25zID1cbiAgICAgIGZyb206IGZyb21cbiAgICAgIHRvOiAgIHRvXG4gICAgZGVsdGEgPVxuICAgICAgYXR0cnM6IGF0dHJzXG4gICAgICB0eXBlOiAgXCJzZWxlY3RcIlxuXG4gICAgaWYgb3ZlcndyaXRlPyBhbmQgb3ZlcndyaXRlXG4gICAgICBkZWx0YS5vdmVyd3JpdGUgPSB0cnVlXG5cbiAgICBAX21vZGVsLmFwcGx5RGVsdGEoZGVsdGEsIGRlbHRhX29wZXJhdGlvbnMpXG5cbiAgdW5zZWxlY3RBbGw6IChmcm9tLCB0byktPlxuICAgIHNlbGVjdCBmcm9tLCB0bywge30sIHRydWVcblxuICAjIHVuc2VsZWN0IF9mcm9tXyBfdG9fIHdpdGggYW4gX2F0dHJpYnV0ZV8sIHJlc3VsdGluZyBpbiB0aGUgcmVtb3ZhbCBvZiB0aGVcbiAgIyBvZiBhbnkgc2VsZWN0aW9uIHdpdGhpbiB0aGVzZSBib3VuZHMuXG4gICMgQHBhcmFtIGZyb20gW1kuTGlzdCBpdGVtXSB0aGUgc3RhcnQgb2YgdGhlIHNlbGVjdGlvblxuICAjIEBwYXJhbSB0byBbWS5MaXN0IGl0ZW1dIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvblxuICAjIEBwYXJhbSBhdHRycyBbT2JqZWN0XSB0aGUgYXR0cmlidXRlcyBvZiB0aGUgc2VsZWN0aW9uXG4gIHVuc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzKS0+XG4gICAgaWYgdHlwZW9mIGF0dHJzIGlzIFwic3RyaW5nXCJcbiAgICAgIGF0dHJzID0gW2F0dHJzXVxuICAgIGlmIGF0dHJzLmNvbnN0cnVjdG9yIGlzbnQgQXJyYXlcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlkuU2VsZWN0aW9ucy5wcm90b3R5cGUudW5zZWxlY3QgZXhwZWN0cyBhbiBBcnJheSBvclxuICAgICAgICBTdHJpbmcgYXMgdGhlIHRoaXJkIHBhcmFtZXRlciAoYXR0cmlidXRlcykhXCJcbiAgICBpZiBhdHRycy5sZW5ndGggPD0gMFxuICAgICAgcmV0dXJuXG4gICAgZGVsdGFfb3BlcmF0aW9ucyA9XG4gICAgICBmcm9tOiBmcm9tXG4gICAgICB0bzogICB0b1xuICAgIGRlbHRhID1cbiAgICAgIGF0dHJzOiBhdHRyc1xuICAgICAgdHlwZTogIFwidW5zZWxlY3RcIlxuXG4gICAgQF9tb2RlbC5hcHBseURlbHRhKGRlbHRhLCBkZWx0YV9vcGVyYXRpb25zKVxuXG4gICMgR2V0IGFsbCB0aGUgc2VsZWN0aW9ucyBjb3ZlcmluZyB0aGUgYXJndW1lbnRcbiAgIyBAcGFyYW0gbGlzdCBbWS5MaXN0XSBhIGRvdWJseS1jaGFpbmVkIGxpc3Qgb2YgaXRlbXMgd2hlcmUgdG8gbG9vayBmb3Igc2VsZWN0aW9uc1xuICAjIEByZXR1cm4gW0FycmF5PFNlbGVjdGlvbj5dXG4gICMgQG5vdGUgdGhlIGZ1bmN0aW9uIGFsc28gY2hlY2sgdGhlIGNvbnNpc3RlbmN5IG9mIHRoZSBzZWxlY3Rpb25zXG4gIGdldFNlbGVjdGlvbnM6IChsaXN0KS0+XG4gICAgZWxlbWVudCA9IGxpc3QucmVmKDApXG4gICAgaWYgbm90IGVsZW1lbnQ/XG4gICAgICByZXR1cm4gW11cblxuICAgIHNlbF9zdGFydCA9IG51bGxcbiAgICBwb3MgPSAwXG4gICAgcmVzdWx0ID0gW11cblxuICAgICMgZ28gdGhyb3VnaCB0aGUgbGlzdCBlbGVtZW50IGJ5IGVsZW1lbnRcbiAgICB3aGlsZSBlbGVtZW50Lm5leHRfY2w/XG4gICAgICAjIGNoZWNrIHRoYXQgYSBkZWxldGVkIGVsZW1lbnQgaGFzIG5vIHNlbGVjdGlvbiBib3VuZGVkIGFueW1vcmVcbiAgICAgIGlmIGVsZW1lbnQuaXNEZWxldGVkKClcbiAgICAgICAgaWYgZWxlbWVudC5zZWxlY3Rpb24/XG4gICAgICAgICAgY29uc29sZS5sb2cgXCJZb3UgZm9yZ290IHRvIGRlbGV0ZSB0aGUgc2VsZWN0aW9uIGZyb20gdGhpcyBvcGVyYXRpb24hXG4gICAgICAgICAgICBQbGVhc2Ugd3JpdGUgYW4gaXNzdWUgaG93IHRvIHJlcHJvZHVjZSB0aGlzIGJ1ZyEgKGl0IGNvdWxkIGxlYWQgdG9cbiAgICAgICAgICAgIGluY29uc2lzdGVuY2llcyEpXCJcbiAgICAgICAgIyBkZWxldGVkIGVsZW1lbnQsIGp1bXAgdG8gZWxlbWVudFxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudC5uZXh0X2NsXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICBpZiBlbGVtZW50LnNlbGVjdGlvbj9cbiAgICAgICAgIyBpZiBhIHNlbGVjdGlvbiBzdGFydHMgaGVyZSwgc2F2ZSB0aGUgc3RhcnQgcG9zaXRpb25cbiAgICAgICAgaWYgZWxlbWVudC5zZWxlY3Rpb24uZnJvbSBpcyBlbGVtZW50XG4gICAgICAgICAgaWYgc2VsX3N0YXJ0P1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRm91bmQgdHdvIGNvbnNlY3V0aXZlIGZyb20gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zXG4gICAgICAgICAgICAgIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNlbF9zdGFydCA9IHBvc1xuICAgICAgICAjIGlmIGEgc2VsZWN0aW9uIGVuZHMgaGVyZSwgYWRkIGl0IHRvIHJldHVybiB2YWx1ZVxuICAgICAgICBpZiBlbGVtZW50LnNlbGVjdGlvbi50byBpcyBlbGVtZW50XG4gICAgICAgICAgaWYgc2VsX3N0YXJ0P1xuICAgICAgICAgICAgbnVtYmVyX29mX2F0dHJzID0gMFxuICAgICAgICAgICAgYXR0cnMgPSB7fVxuICAgICAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBlbGVtZW50LnNlbGVjdGlvbi5hdHRyc1xuICAgICAgICAgICAgICBhdHRyc1trZXldID0gdmFsdWVcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoXG4gICAgICAgICAgICAgIGZyb206ICBzZWxfc3RhcnRcbiAgICAgICAgICAgICAgdG86ICAgIHBvc1xuICAgICAgICAgICAgICBhdHRyczogYXR0cnNcbiAgICAgICAgICAgIHNlbF9zdGFydCA9IG51bGxcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJGb3VuZCB0d28gY29uc2VjdXRpdmUgdG8gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zIFxuICAgICAgICAgICAgICBhcmUgbm8gbG9uZ2VyIHNhZmUgdG8gdXNlISAoY29udGFjdCB0aGUgb3duZXIgb2YgdGhlIHJlcG9zaXRvcnkpXCJcbiAgICAgICAgIyBjYW4gaXQgaGFwcGVuIHNpbmNlIHdlIGNoZWNrZWQgdGhhdCBlbGVtZW50LlNlbGVjdGlvbi5mcm9tIGlzIGVsZW1lbnRcbiAgICAgICAgZWxzZSBpZiBlbGVtZW50LnNlbGVjdGlvbi5mcm9tIGlzbnQgZWxlbWVudFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIlRoaXMgcmVmZXJlbmNlIHNob3VsZCBub3QgcG9pbnQgdG8gdGhpcyBzZWxlY3Rpb24sXG4gICAgICAgICAgICBiZWNhdXNlIHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgcG9pbnQgdG8gdGhlIHJlZmVyZW5jZS4gVGhlXG4gICAgICAgICAgICBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGVcbiAgICAgICAgICAgIHJlcG9zaXRvcnkpXCJcbiAgICAgIHBvcysrXG4gICAgICBlbGVtZW50ID0gZWxlbWVudC5uZXh0X2NsXG4gICAgcmV0dXJuIHJlc3VsdFxuXG4gICMgT2JzZXJ2ZSB0aGUgc2VsZWN0aW9uIHdpdGggdGhlIGZ1bmN0aW9uXG4gICMgQHBhcmFtIGZ1biBbRnVuY3Rpb25dIHRoZSBsaXN0ZW5pbmcgZnVuY3Rpb25cbiAgb2JzZXJ2ZTogKGZ1biktPlxuICAgIEBfbGlzdGVuZXJzLnB1c2ggZnVuXG5cbiAgIyBSZW1vdmUgdGhlIGZ1bmN0aW9uIGZyb20gdGhlIG9ic2VydmVyc1xuICAjIEBwYXJhbSBmdW4gW0Z1bmN0aW9uXSB0aGUgZnVuY3Rpb24gdG8gcmVtb3ZlXG4gIHVub2JzZXJ2ZTogKGZ1biktPlxuICAgIEBfbGlzdGVuZXJzID0gQF9saXN0ZW5lcnMuZmlsdGVyIChvdGhlckZ1biktPlxuICAgICAgZnVuICE9IG90aGVyRnVuXG5cblxuaWYgd2luZG93P1xuICBpZiB3aW5kb3cuWT9cbiAgICB3aW5kb3cuWS5TZWxlY3Rpb25zID0gWVNlbGVjdGlvbnNcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvciBcIllvdSBtdXN0IGZpcnN0IGltcG9ydCBZIVwiXG5cbmlmIG1vZHVsZT9cbiAgbW9kdWxlLmV4cG9ydHMgPSBZU2VsZWN0aW9uc1xuIl19
