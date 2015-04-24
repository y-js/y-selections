(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var YSelections, compare_objects;

compare_objects = function(o, p, doAgain) {
  var n, v;
  if (doAgain == null) {
    doAgain = true;
  }
  for (n in o) {
    v = o[n];
    if (!((p[n] != null) && p[n] === v)) {
      return false;
    }
  }
  if (doAgain) {
    return compare_objects(p, o, false);
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
    var composition_value, composition_value_operations, i, v;
    composition_value_operations = {};
    composition_value = (function() {
      var _i, _len, _ref, _results;
      _ref = this._composition_value;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        v = _ref[i];
        composition_value_operations["" + i + "/from"] = v.from;
        composition_value_operations["" + i + "/to"] = v.to;
        _results.push({
          attrs: v.attrs
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
    var v, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = composition_value.length; _i < _len; _i++) {
      v = composition_value[_i];
      v.type = "select";
      _results.push(this._apply(v));
    }
    return _results;
  };

  YSelections.prototype._apply = function(delta) {
    var a, attr, attr_list, createSelection, cut_off_from, cut_off_to, delta_has_attrs, end, extendSelection, from, l, n, o, o_next, observer_call, p, parent, parent_exists, selection, selection_is_empty, start, to, to_next, undos, v, _i, _j, _len, _len1, _ref, _ref1, _ref2;
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
                    prev = ref.getNext();
                    sel.from = prev;
                    prev.selection = sel;
                  } else if (sel.to === ref) {
                    next = ref.getPrev();
                    sel.to = next;
                    next.selection = sel;
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
      l = _ref1[_j];
      l.call(this, observer_call);
    }
    createSelection = (function(_this) {
      return function(from, to, attrs) {
        var n, new_attrs, new_sel, v;
        new_attrs = {};
        for (n in attrs) {
          v = attrs[n];
          new_attrs[n] = v;
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
      var n, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v, _k, _len2, _ref2, _ref3, _ref4;
      if (delta.type === "unselect") {
        undo_attrs = {};
        _ref2 = delta.attrs;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          n = _ref2[_k];
          if (selection.attrs[n] != null) {
            undo_attrs[n] = selection.attrs[n];
          }
          delete selection.attrs[n];
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
          for (n in _ref3) {
            v = _ref3[n];
            if (delta.attrs[n] == null) {
              undo_need_select = true;
              undo_attrs[n] = v;
            }
          }
          for (n in undo_attrs) {
            v = undo_attrs[n];
            delete selection.attrs[n];
          }
        }
        _ref4 = delta.attrs;
        for (n in _ref4) {
          v = _ref4[n];
          if (selection.attrs[n] != null) {
            undo_attrs[n] = selection.attrs[n];
            undo_need_select = true;
          } else {
            undo_attrs_list.push(n);
            undo_need_unselect = true;
          }
          selection.attrs[n] = v;
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
      var new_selection, o, old_selection, opt_selection;
      if ((from.selection != null) && from.selection.from === from) {
        return;
      }
      o = from.getPrev();
      while ((o.selection == null) && (o.type !== "Delimiter")) {
        o = o.getPrev();
      }
      if ((o.selection == null) || o.selection.to === o) {
        return;
      }
      old_selection = o.selection;
      o = from;
      while ((o !== old_selection.to) && (o !== to)) {
        o = o.getNext();
      }
      if (o === old_selection.to) {
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
      var new_selection, o, old_selection;
      if ((to.selection != null) && to.selection.to === to) {
        return;
      }
      o = to;
      while ((o.selection == null) && (o !== from)) {
        o = o.getPrev();
      }
      if ((o.selection == null) || o.selection["to"] === o) {
        return;
      }
      old_selection = o.selection;
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
    o = from;
    to_next = to.getNext();
    while (o !== to_next) {
      if (o.selection != null) {
        extendSelection(o.selection, delta);
        selection = o.selection;
        this._combine_selection_to_left(selection);
        o = selection.to.getNext();
        selection_is_empty = true;
        for (attr in selection.attrs) {
          selection_is_empty = false;
          break;
        }
        if (selection_is_empty) {
          this._removeFromCompositionValue(selection);
        }
      } else {
        start = o;
        o_next = o.getNext();
        while ((o_next.selection == null) && (o !== to)) {
          o = o_next;
          o_next = o.getNext();
        }
        end = o;
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
          this._combine_selection_to_left(o.selection);
        }
        o = o.getNext();
      }
    }
    if (o.selection != null) {
      this._combine_selection_to_left(o.selection);
    }
    if (from.selection != null) {
      this._combine_selection_to_left(from.selection);
    }
    return undos;
  };

  YSelections.prototype._removeFromCompositionValue = function(sel) {
    this._composition_value = this._composition_value.filter(function(o) {
      return o !== sel;
    });
    delete sel.from.selection;
    return delete sel.to.selection;
  };

  YSelections.prototype._combine_selection_to_left = function(sel) {
    var first_o, new_from;
    first_o = sel.from.getPrev();
    if (first_o.selection == null) {

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
    var attrs, n, number_of_attrs, o, pos, result, sel_start, v, _ref;
    o = list.ref(0);
    if (o == null) {
      return [];
    }
    sel_start = null;
    pos = 0;
    result = [];
    while (o.next_cl != null) {
      if (o.isDeleted()) {
        if (o.selection != null) {
          console.log("You forgot to delete the selection from this operation! Please write an issue how to reproduce this bug! (it could lead to inconsistencies!)");
        }
        o = o.next_cl;
        continue;
      }
      if (o.selection != null) {
        if (o.selection.from === o) {
          if (sel_start != null) {
            throw new Error("Found two consecutive from elements. The selections are no longer safe to use! (contact the owner of the repository)");
          } else {
            sel_start = pos;
          }
        }
        if (o.selection.to === o) {
          if (sel_start != null) {
            number_of_attrs = 0;
            attrs = {};
            _ref = o.selection.attrs;
            for (n in _ref) {
              v = _ref[n];
              attrs[n] = v;
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
        } else if (o.selection.from !== o) {
          throw new Error("This reference should not point to this selection, because the selection does not point to the reference. The selections are no longer safe to use! (contact the owner of the repository)");
        }
      }
      pos++;
      o = o.next_cl;
    }
    return result;
  };

  YSelections.prototype.observe = function(f) {
    return this._listeners.push(f);
  };

  YSelections.prototype.unobserve = function(f) {
    return this._listeners = this._listeners.filter(function(g) {
      return f !== g;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkg6XFxHaXRIdWJcXHktc2VsZWN0aW9uc1xcbm9kZV9tb2R1bGVzXFxndWxwLWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiSDpcXEdpdEh1YlxceS1zZWxlY3Rpb25zXFxsaWJcXHktc2VsZWN0aW9ucy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNFQSxJQUFBLDRCQUFBOztBQUFBLGVBQUEsR0FBa0IsU0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLE9BQVAsR0FBQTtBQUNoQixNQUFBLElBQUE7O0lBRHVCLFVBQVE7R0FDL0I7QUFBQSxPQUFBLE1BQUE7YUFBQTtBQUNFLElBQUEsSUFBRyxDQUFBLENBQUssY0FBQSxJQUFVLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxDQUFuQixDQUFQO0FBQ0UsYUFBTyxLQUFQLENBREY7S0FERjtBQUFBLEdBQUE7QUFHQSxFQUFBLElBQUcsT0FBSDtXQUNFLGVBQUEsQ0FBZ0IsQ0FBaEIsRUFBa0IsQ0FBbEIsRUFBb0IsS0FBcEIsRUFERjtHQUFBLE1BQUE7V0FHRSxLQUhGO0dBSmdCO0FBQUEsQ0FBbEIsQ0FBQTs7QUFBQTtBQVdlLEVBQUEscUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBQUE7QUFBQSxJQUNBLElBQUMsQ0FBQSxrQkFBRCxHQUFzQixFQUR0QixDQUFBO0FBQUEsSUFHQSxJQUFDLENBQUEsTUFBRCxHQUFVLEVBSFYsQ0FEVztFQUFBLENBQWI7O0FBQUEsd0JBTUEsS0FBQSxHQUFPLFlBTlAsQ0FBQTs7QUFBQSx3QkFRQSxTQUFBLEdBQVcsU0FBQyxDQUFELEVBQUksU0FBSixHQUFBO0FBQ1QsSUFBQSxJQUFPLG1CQUFQO0FBQ0UsTUFBQSxJQUFDLENBQUEsTUFBRCxHQUFjLElBQUEsU0FBUyxDQUFDLFdBQVYsQ0FBc0IsSUFBdEIsRUFBeUIs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QUFBQSx3QkFxY0EsT0FBQSxHQUFTLFNBQUMsQ0FBRCxHQUFBO1dBQ1AsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQWlCLENBQWpCLEVBRE87RUFBQSxDQXJjVCxDQUFBOztBQUFBLHdCQXdjQSxTQUFBLEdBQVcsU0FBQyxDQUFELEdBQUE7V0FDVCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBWixDQUFtQixTQUFDLENBQUQsR0FBQTthQUMvQixDQUFBLEtBQUssRUFEMEI7SUFBQSxDQUFuQixFQURMO0VBQUEsQ0F4Y1gsQ0FBQTs7cUJBQUE7O0lBWEYsQ0FBQTs7QUF3ZEEsSUFBRyxnREFBSDtBQUNFLEVBQUEsSUFBRyxnQkFBSDtBQUNFLElBQUEsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFULEdBQXNCLFdBQXRCLENBREY7R0FBQSxNQUFBO0FBR0UsVUFBVSxJQUFBLEtBQUEsQ0FBTSwwQkFBTixDQUFWLENBSEY7R0FERjtDQXhkQTs7QUE4ZEEsSUFBRyxnREFBSDtBQUNFLEVBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsV0FBakIsQ0FERjtDQTlkQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcclxuIyBjb21wYXJlIHR3byBvYmplY3QgZm9yIGVxdWFsaXR5IChubyBkZWVwIGNoZWNrISlcclxuY29tcGFyZV9vYmplY3RzID0gKG8sIHAsIGRvQWdhaW49dHJ1ZSktPlxyXG4gIGZvciBuLHYgb2Ygb1xyXG4gICAgaWYgbm90IChwW25dPyBhbmQgcFtuXSBpcyB2KVxyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICBpZiBkb0FnYWluXHJcbiAgICBjb21wYXJlX29iamVjdHMocCxvLGZhbHNlKVxyXG4gIGVsc2VcclxuICAgIHRydWVcclxuXHJcblxyXG5jbGFzcyBZU2VsZWN0aW9uc1xyXG4gIGNvbnN0cnVjdG9yOiAoKS0+XHJcbiAgICBAX2xpc3RlbmVycyA9IFtdXHJcbiAgICBAX2NvbXBvc2l0aW9uX3ZhbHVlID0gW11cclxuICAgICMgd2UgcHV0IGFsbCB0aGUgbGlzdHMgd2UgdXNlIGluIHRoaXMgYXJyYXlcclxuICAgIEBfbGlzdHMgPSBbXVxyXG5cclxuICBfbmFtZTogXCJTZWxlY3Rpb25zXCJcclxuXHJcbiAgX2dldE1vZGVsOiAoWSwgT3BlcmF0aW9uKSAtPlxyXG4gICAgaWYgbm90IEBfbW9kZWw/XHJcbiAgICAgIEBfbW9kZWwgPSBuZXcgT3BlcmF0aW9uLkNvbXBvc2l0aW9uKEAsIFtdKS5leGVjdXRlKClcclxuICAgIEBfbW9kZWxcclxuXHJcbiAgX3NldE1vZGVsOiAoQF9tb2RlbCktPlxyXG5cclxuICBfZ2V0Q29tcG9zaXRpb25WYWx1ZTogKCktPlxyXG4gICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9ucyA9IHt9XHJcbiAgICBjb21wb3NpdGlvbl92YWx1ZSA9IGZvciB2LGkgaW4gQF9jb21wb3NpdGlvbl92YWx1ZVxyXG4gICAgICBjb21wb3NpdGlvbl92YWx1ZV9vcGVyYXRpb25zW1wiXCIraStcIi9mcm9tXCJdID0gdi5mcm9tXHJcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlX29wZXJhdGlvbnNbXCJcIitpK1wiL3RvXCJdID0gdi50b1xyXG4gICAgICB7XHJcbiAgICAgICAgYXR0cnM6IHYuYXR0cnNcclxuICAgICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGNvbXBvc2l0aW9uX3ZhbHVlIDogY29tcG9zaXRpb25fdmFsdWVcclxuICAgICAgY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9uczogY29tcG9zaXRpb25fdmFsdWVfb3BlcmF0aW9uc1xyXG4gICAgfVxyXG5cclxuXHJcbiAgX3NldENvbXBvc2l0aW9uVmFsdWU6IChjb21wb3NpdGlvbl92YWx1ZSktPlxyXG4gICAgZm9yIHYgaW4gY29tcG9zaXRpb25fdmFsdWVcclxuICAgICAgdi50eXBlID0gXCJzZWxlY3RcIlxyXG4gICAgICBAX2FwcGx5IHZcclxuXHJcbiAgX2FwcGx5OiAoZGVsdGEpLT5cclxuICAgIHVuZG9zID0gW10gIyBsaXN0IG9mIGRlbHRhcyB0aGF0IGFyZSBuZWNlc3NhcnkgdG8gdW5kbyB0aGUgY2hhbmdlXHJcblxyXG4gICAgaWYgZGVsdGEuZnJvbS5pc0RlbGV0ZWQoKVxyXG4gICAgICBkZWx0YS5mcm9tID0gZGVsdGEuZnJvbS5nZXROZXh0KClcclxuICAgIGlmIGRlbHRhLnRvLmlzRGVsZXRlZCgpXHJcbiAgICAgIGRlbHRhLnRvID0gZGVsdGEudG8uZ2V0UHJldigpXHJcblxyXG4gICAgZnJvbSA9IGRlbHRhLmZyb21cclxuICAgIHRvID0gZGVsdGEudG9cclxuICAgIGlmIGZyb20uZ2V0UHJldigpIGlzIHRvXHJcbiAgICAgICMgVGhlcmUgaXMgbm90aGluZyB0byBzZWxlY3QgYW55bW9yZSFcclxuICAgICAgcmV0dXJuIHVuZG9zXHJcblxyXG5cclxuICAgICNcclxuICAgICMgQXNzdW1pbmcgJGZyb20gaXMgZGVsZXRlZCBhdCBzb21lIHBvaW50LiBXZSBuZWVkIHRvIGNoYW5nZSB0aGUgc2VsZWN0aW9uXHJcbiAgICAjIF9iZWZvcmVfIHRoZSBHQyByZW1vdmVzIGl0IGNvbXBsZXRlbHkgZnJvbSB0aGUgbGlzdC4gVGhlcmVmb3JlLCB3ZSBsaXN0ZW4gdG9cclxuICAgICMgXCJkZWxldGVcIiBldmVudHMsIGFuZCBpZiB0aGF0IHBhcnRpY3VsYXIgb3BlcmF0aW9uIGhhcyBhIHNlbGVjdGlvblxyXG4gICAgIyAoby5zc2VsZWN0aW9uPykgd2UgbW92ZSB0aGUgc2VsZWN0aW9uIHRvIHRoZSBuZXh0IHVuZGVsZXRlZCBvcGVyYXRpb24sIGlmXHJcbiAgICAjIGFueS4gSXQgYWxzbyBoYW5kbGVzIHRoZSBjYXNlIHRoYXQgdGhlcmUgaXMgbm90aGluZyB0byBzZWxlY3QgYW55bW9yZSAoZS5nLlxyXG4gICAgIyBldmVyeXRoaW5nIGluc2lkZSB0aGUgc2VsZWN0aW9uIGlzIGRlbGV0ZWQpLiBUaGVuIHdlIHJlbW92ZSB0aGUgc2VsZWN0aW9uXHJcbiAgICAjIGNvbXBsZXRlbHlcclxuICAgICNcclxuICAgICMgaWYgbmV2ZXIgYXBwbGllZCBhIGRlbHRhIG9uIHRoaXMgbGlzdCwgYWRkIGEgbGlzdGVuZXIgdG8gaXQgaW4gb3JkZXIgdG8gY2hhbmdlIHNlbGVjdGlvbnMgaWYgbmVjZXNzYXJ5XHJcbiAgICBpZiBkZWx0YS50eXBlIGlzIFwic2VsZWN0XCJcclxuICAgICAgcGFyZW50ID0gZnJvbS5nZXRQYXJlbnQoKVxyXG4gICAgICBwYXJlbnRfZXhpc3RzID0gZmFsc2VcclxuICAgICAgZm9yIHAgaW4gQF9saXN0c1xyXG4gICAgICAgIGlmIHBhcmVudCBpcyBAX2xpc3RzW3BdXHJcbiAgICAgICAgICBwYXJlbnRfZXhpc3RzID0gdHJ1ZVxyXG4gICAgICAgICAgYnJlYWtcclxuICAgICAgaWYgbm90IHBhcmVudF9leGlzdHNcclxuICAgICAgICBAX2xpc3RzLnB1c2ggcGFyZW50XHJcbiAgICAgICAgcGFyZW50Lm9ic2VydmUgKGV2ZW50cyk9PlxyXG4gICAgICAgICAgZm9yIGV2ZW50IGluIGV2ZW50c1xyXG4gICAgICAgICAgICBpZiBldmVudC50eXBlIGlzIFwiZGVsZXRlXCJcclxuICAgICAgICAgICAgICBpZiBldmVudC5yZWZlcmVuY2Uuc2VsZWN0aW9uP1xyXG4gICAgICAgICAgICAgICAgcmVmID0gZXZlbnQucmVmZXJlbmNlXHJcbiAgICAgICAgICAgICAgICBzZWwgPSByZWYuc2VsZWN0aW9uXHJcbiAgICAgICAgICAgICAgICBkZWxldGUgcmVmLnNlbGVjdGlvbiAjIGRlbGV0ZSBpdCwgYmVjYXVzZSByZWYgaXMgZ29pbmcgdG8gZ2V0IGRlbGV0ZWQhXHJcbiAgICAgICAgICAgICAgICBpZiBzZWwuZnJvbSBpcyByZWYgYW5kIHNlbC50byBpcyByZWZcclxuICAgICAgICAgICAgICAgICAgQF9yZW1vdmVGcm9tQ29tcG9zaXRpb25WYWx1ZSBzZWxcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgc2VsLmZyb20gaXMgcmVmXHJcbiAgICAgICAgICAgICAgICAgIHByZXYgPSByZWYuZ2V0TmV4dCgpXHJcbiAgICAgICAgICAgICAgICAgIHNlbC5mcm9tID0gcHJldlxyXG4gICAgICAgICAgICAgICAgICBwcmV2LnNlbGVjdGlvbiA9IHNlbFxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBzZWwudG8gaXMgcmVmXHJcbiAgICAgICAgICAgICAgICAgIG5leHQgPSByZWYuZ2V0UHJldigpXHJcbiAgICAgICAgICAgICAgICAgIHNlbC50byA9IG5leHRcclxuICAgICAgICAgICAgICAgICAgbmV4dC5zZWxlY3Rpb24gPSBzZWxcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRm91bmQgd2VpcmQgaW5jb25zaXN0ZW5jeSEgWS5TZWxlY3Rpb25zIGlzIG5vIGxvbmdlciBzYWZlIHRvIHVzZSFcIlxyXG4gICAgICAgICAgICAgIG5leHQgPSBldmVudC5yZWZlcmVuY2UuZ2V0TmV4dCgpXHJcbiAgICAgICAgICAgICAgaWYgbmV4dC5zZWxlY3Rpb24/XHJcbiAgICAgICAgICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgbmV4dC5zZWxlY3Rpb25cclxuXHJcbiAgICAjIG5vdGlmeSBsaXN0ZW5lcnM6XHJcbiAgICBvYnNlcnZlcl9jYWxsID1cclxuICAgICAgZnJvbTogZnJvbVxyXG4gICAgICB0bzogdG9cclxuICAgICAgdHlwZTogZGVsdGEudHlwZVxyXG4gICAgICBhdHRyczogZGVsdGEuYXR0cnNcclxuICAgIGZvciBsIGluIEBfbGlzdGVuZXJzXHJcbiAgICAgIGwuY2FsbCB0aGlzLCBvYnNlcnZlcl9jYWxsXHJcbiAgICBjcmVhdGVTZWxlY3Rpb24gPSAoZnJvbSwgdG8sIGF0dHJzKT0+XHJcbiAgICAgIG5ld19hdHRycyA9IHt9XHJcbiAgICAgIGZvciBuLHYgb2YgYXR0cnNcclxuICAgICAgICBuZXdfYXR0cnNbbl0gPSB2XHJcbiAgICAgIG5ld19zZWwgPSB7XHJcbiAgICAgICAgZnJvbTogZnJvbVxyXG4gICAgICAgIHRvOiB0b1xyXG4gICAgICAgIGF0dHJzOiBuZXdfYXR0cnNcclxuICAgICAgfVxyXG4gICAgICBAX2NvbXBvc2l0aW9uX3ZhbHVlLnB1c2ggbmV3X3NlbFxyXG4gICAgICBuZXdfc2VsXHJcblxyXG4gICAgZXh0ZW5kU2VsZWN0aW9uID0gKHNlbGVjdGlvbiktPlxyXG4gICAgICBpZiBkZWx0YS50eXBlIGlzIFwidW5zZWxlY3RcIlxyXG4gICAgICAgIHVuZG9fYXR0cnMgPSB7fVxyXG4gICAgICAgIGZvciBuIGluIGRlbHRhLmF0dHJzXHJcbiAgICAgICAgICBpZiBzZWxlY3Rpb24uYXR0cnNbbl0/XHJcbiAgICAgICAgICAgIHVuZG9fYXR0cnNbbl0gPSBzZWxlY3Rpb24uYXR0cnNbbl1cclxuICAgICAgICAgIGRlbGV0ZSBzZWxlY3Rpb24uYXR0cnNbbl1cclxuICAgICAgICB1bmRvcy5wdXNoXHJcbiAgICAgICAgICBmcm9tOiBkZWx0YS5mcm9tXHJcbiAgICAgICAgICB0bzogZGVsdGEudG9cclxuICAgICAgICAgIGF0dHJzOiB1bmRvX2F0dHJzXHJcbiAgICAgICAgICB0eXBlOiBcInNlbGVjdFwiXHJcbiAgICAgIGVsc2VcclxuICAgICAgICB1bmRvX2F0dHJzID0ge30gIyBmb3IgdW5kbyBzZWxlY3Rpb24gKG92ZXJ3cml0ZSBvZiBleGlzdGluZyBzZWxlY3Rpb24pXHJcbiAgICAgICAgdW5kb19hdHRyc19saXN0ID0gW10gIyBmb3IgdW5kbyBzZWxlY3Rpb24gKG5vdCBvdmVyd3JpdGUpXHJcbiAgICAgICAgdW5kb19uZWVkX3Vuc2VsZWN0ID0gZmFsc2VcclxuICAgICAgICB1bmRvX25lZWRfc2VsZWN0ID0gZmFsc2VcclxuICAgICAgICBpZiBkZWx0YS5vdmVyd3JpdGU/IGFuZCBkZWx0YS5vdmVyd3JpdGVcclxuICAgICAgICAgICMgb3ZlcndyaXRlIGV2ZXJ5dGhpbmcgdGhhdCB0aGUgZGVsdGEgZG9lc24ndCBleHBlY3RcclxuICAgICAgICAgIGZvciBuLHYgb2Ygc2VsZWN0aW9uLmF0dHJzXHJcbiAgICAgICAgICAgIGlmIG5vdCBkZWx0YS5hdHRyc1tuXT9cclxuICAgICAgICAgICAgICB1bmRvX25lZWRfc2VsZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgICAgIHVuZG9fYXR0cnNbbl0gPSB2XHJcbiAgICAgICAgICAgICAgIyBtdXN0IG5vdCBkZWxldGUgYXR0cmlidXRlcyBvZiAkc2VsZWN0aW9uLmF0dHJzIGluIHRoaXMgbG9vcCxcclxuICAgICAgICAgICAgICAjIHNvIHdlIGRvIGl0IGluIHRoZSBuZXh0IG9uZVxyXG4gICAgICAgICAgZm9yIG4sdiBvZiB1bmRvX2F0dHJzXHJcbiAgICAgICAgICAgIGRlbGV0ZSBzZWxlY3Rpb24uYXR0cnNbbl1cclxuXHJcbiAgICAgICAgIyBhcHBseSB0aGUgZGVsdGEgb24gdGhlIHNlbGVjdGlvblxyXG4gICAgICAgIGZvciBuLHYgb2YgZGVsdGEuYXR0cnNcclxuICAgICAgICAgIGlmIHNlbGVjdGlvbi5hdHRyc1tuXT9cclxuICAgICAgICAgICAgdW5kb19hdHRyc1tuXSA9IHNlbGVjdGlvbi5hdHRyc1tuXVxyXG4gICAgICAgICAgICB1bmRvX25lZWRfc2VsZWN0ID0gdHJ1ZVxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1bmRvX2F0dHJzX2xpc3QucHVzaCBuXHJcbiAgICAgICAgICAgIHVuZG9fbmVlZF91bnNlbGVjdCA9IHRydWVcclxuICAgICAgICAgIHNlbGVjdGlvbi5hdHRyc1tuXSA9IHZcclxuICAgICAgICBpZiB1bmRvX25lZWRfc2VsZWN0XHJcbiAgICAgICAgICB1bmRvcy5wdXNoXHJcbiAgICAgICAgICAgIGZyb206IHNlbGVjdGlvbi5mcm9tXHJcbiAgICAgICAgICAgIHRvOiBzZWxlY3Rpb24udG9cclxuICAgICAgICAgICAgYXR0cnM6IHVuZG9fYXR0cnNcclxuICAgICAgICAgICAgdHlwZTogXCJzZWxlY3RcIlxyXG4gICAgICAgIGlmIHVuZG9fbmVlZF91bnNlbGVjdFxyXG4gICAgICAgICAgdW5kb3MucHVzaFxyXG4gICAgICAgICAgICBmcm9tOiBzZWxlY3Rpb24uZnJvbVxyXG4gICAgICAgICAgICB0bzogc2VsZWN0aW9uLnRvXHJcbiAgICAgICAgICAgIGF0dHJzOiB1bmRvX2F0dHJzX2xpc3RcclxuICAgICAgICAgICAgdHlwZTogXCJ1bnNlbGVjdFwiXHJcblxyXG4gICAgIyBBbGdvcml0aG0gb3ZlcnZpZXc6XHJcbiAgICAjIDEuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCBmcm9tXHJcbiAgICAjIDIuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCB0b1xyXG4gICAgIyAzLiBleHRlbmQgLyBhZGQgc2VsZWN0aW9ucyBpbmJldHdlZW5cclxuICAgICNcclxuICAgICMjIyMgMS4gY3V0IG9mZiB0aGUgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoIGZyb21cclxuICAgICNcclxuICAgIGN1dF9vZmZfZnJvbSA9ICgpLT5cclxuICAgICAgIyBjaGVjayBpZiBhIHNlbGVjdGlvbiAodG8gdGhlIGxlZnQgb2YgJGZyb20pIGludGVyc2VjdHMgd2l0aCAkZnJvbVxyXG4gICAgICBpZiBmcm9tLnNlbGVjdGlvbj8gYW5kIGZyb20uc2VsZWN0aW9uLmZyb20gaXMgZnJvbVxyXG4gICAgICAgICMgZG9lcyBub3QgaW50ZXJzZWN0LCBiZWNhdXNlIHRoZSBzdGFydCBpcyBhbHJlYWR5IHNlbGVjdGVkXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICAgICMgZmluZCBmaXJzdCBzZWxlY3Rpb24gdG8gdGhlIGxlZnRcclxuICAgICAgbyA9IGZyb20uZ2V0UHJldigpXHJcbiAgICAgIHdoaWxlIChub3Qgby5zZWxlY3Rpb24/KSBhbmQgKG8udHlwZSBpc250IFwiRGVsaW1pdGVyXCIpXHJcbiAgICAgICAgbyA9IG8uZ2V0UHJldigpXHJcbiAgICAgIGlmIChub3Qgby5zZWxlY3Rpb24/KSBvciBvLnNlbGVjdGlvbi50byBpcyBvXHJcbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb25cclxuICAgICAgICByZXR1cm5cclxuICAgICAgIyBXZSBmb3VuZCBhIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkZnJvbS5cclxuICAgICAgIyBOb3cgd2UgaGF2ZSB0byBjaGVjayBpZiBpdCBhbHNvIGludGVyc2VjdHMgd2l0aCAkdG8uXHJcbiAgICAgICMgVGhlbiB3ZSBjdXQgaXQgaW4gc3VjaCBhIHdheSxcclxuICAgICAgIyB0aGF0IHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgaW50ZXJzZWN0IHdpdGggJGZyb20gYW5kICR0byBhbnltb3JlLlxyXG5cclxuICAgICAgIyB0aGlzIGlzIGEgcmVmZXJlbmNlIGZvciB0aGUgc2VsZWN0aW9ucyB0aGF0IGFyZSBjcmVhdGVkL21vZGlmaWVkOlxyXG4gICAgICAjIG9sZF9zZWxlY3Rpb24gaXMgb3V0ZXIgKG5vdCBiZXR3ZWVuICRmcm9tICR0bylcclxuICAgICAgIyAgIC0gd2lsbCBiZSBjaGFuZ2VkIGluIHN1Y2ggYSB3YXkgdGhhdCBpdCBpcyB0byB0aGUgbGVmdCBvZiAkZnJvbVxyXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgaW5uZXIgKGluYmV0d2VlbiAkZnJvbSAkdG8pXHJcbiAgICAgICMgICAtIGNyZWF0ZWQsIHJpZ2h0IGFmdGVyICRmcm9tXHJcbiAgICAgICMgb3B0X3NlbGVjdGlvbiBpcyBvdXRlciAoYWZ0ZXIgJHRvKVxyXG4gICAgICAjICAgLSBjcmVhdGVkIChpZiBuZWNlc3NhcnkpLCByaWdodCBhZnRlciAkdG9cclxuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXHJcblxyXG4gICAgICAjIGNoZWNrIGlmIGZvdW5kIHNlbGVjdGlvbiBhbHNvIGludGVyc2VjdHMgd2l0aCAkdG9cclxuICAgICAgIyAqIHN0YXJ0aW5nIGZyb20gJGZyb20sIGdvIHRvIHRoZSByaWdodCB1bnRpbCB5b3UgZm91bmQgZWl0aGVyICR0byBvciBvbGRfc2VsZWN0aW9uLnRvXHJcbiAgICAgICMgKiogaWYgJHRvOiBubyBpbnRlcnNlY3Rpb24gd2l0aCAkdG9cclxuICAgICAgIyAqKiBpZiAkb2xkX3NlbGVjdGlvbi50bzogaW50ZXJzZWN0aW9uIHdpdGggJHRvIVxyXG4gICAgICBvID0gZnJvbVxyXG4gICAgICB3aGlsZSAobyBpc250IG9sZF9zZWxlY3Rpb24udG8pIGFuZCAobyBpc250IHRvKVxyXG4gICAgICAgIG8gPSBvLmdldE5leHQoKVxyXG5cclxuICAgICAgaWYgbyBpcyBvbGRfc2VsZWN0aW9uLnRvXHJcbiAgICAgICAgIyBubyBpbnRlcnNlY3Rpb24gd2l0aCB0byFcclxuICAgICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gZnJvbSwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xyXG5cclxuICAgICAgICAjIHVwZGF0ZSByZWZlcmVuY2VzXHJcbiAgICAgICAgb2xkX3NlbGVjdGlvbi50byA9IGZyb20uZ2V0UHJldigpXHJcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxyXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gb2xkX3NlbGVjdGlvblxyXG5cclxuICAgICAgICBuZXdfc2VsZWN0aW9uLmZyb20uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgIyB0aGVyZSBpcyBhbiBpbnRlcnNlY3Rpb24gd2l0aCB0byFcclxuXHJcbiAgICAgICAgIyBjcmVhdGUgJG5ld19zZWxlY3Rpb25cclxuICAgICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIGZyb20sIHRvLCBvbGRfc2VsZWN0aW9uLmF0dHJzXHJcblxyXG4gICAgICAgICMgY3JlYXRlICRvcHRfc2VsZWN0aW9uXHJcbiAgICAgICAgb3B0X3NlbGVjdGlvbiA9IGNyZWF0ZVNlbGVjdGlvbiB0by5nZXROZXh0KCksIG9sZF9zZWxlY3Rpb24udG8sIG9sZF9zZWxlY3Rpb24uYXR0cnNcclxuXHJcbiAgICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xyXG4gICAgICAgIG9sZF9zZWxlY3Rpb24udG8gPSBmcm9tLmdldFByZXYoKVxyXG4gICAgICAgICMgdXBkYXRlIHJlZmVyZW5jZXMgKHBvaW50ZXJzIHRvIHJlc3BlY3RpdmUgc2VsZWN0aW9ucylcclxuICAgICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgb3B0X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG9wdF9zZWxlY3Rpb25cclxuICAgICAgICBvcHRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9wdF9zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgbmV3X3NlbGVjdGlvbi5mcm9tLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuICAgICAgICBuZXdfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG5ld19zZWxlY3Rpb25cclxuXHJcblxyXG4gICAgY3V0X29mZl9mcm9tKClcclxuXHJcbiAgICAjIDIuIGN1dCBvZmYgdGhlIHNlbGVjdGlvbiB0aGF0IGludGVyc2VjdHMgd2l0aCAkdG9cclxuICAgIGN1dF9vZmZfdG8gPSAoKS0+XHJcbiAgICAgICMgY2hlY2sgaWYgYSBzZWxlY3Rpb24gKHRvIHRoZSBsZWZ0IG9mICR0bykgaW50ZXJzZWN0cyB3aXRoICR0b1xyXG4gICAgICBpZiB0by5zZWxlY3Rpb24/IGFuZCB0by5zZWxlY3Rpb24udG8gaXMgdG9cclxuICAgICAgICAjIGRvZXMgbm90IGludGVyc2VjdCwgYmVjYXVzZSB0aGUgZW5kIGlzIGFscmVhZHkgc2VsZWN0ZWRcclxuICAgICAgICByZXR1cm5cclxuICAgICAgIyBmaW5kIGZpcnN0IHNlbGVjdGlvbiB0byB0aGUgbGVmdFxyXG4gICAgICBvID0gdG9cclxuICAgICAgd2hpbGUgKG5vdCBvLnNlbGVjdGlvbj8pIGFuZCAobyBpc250IGZyb20pXHJcbiAgICAgICAgbyA9IG8uZ2V0UHJldigpXHJcbiAgICAgIGlmIChub3Qgby5zZWxlY3Rpb24/KSBvciBvLnNlbGVjdGlvbltcInRvXCJdIGlzIG9cclxuICAgICAgICAjIG5vIGludGVyc2VjdGlvblxyXG4gICAgICAgIHJldHVyblxyXG4gICAgICAjIFdlIGZvdW5kIGEgc2VsZWN0aW9uIHRoYXQgaW50ZXJzZWN0cyB3aXRoICR0by5cclxuICAgICAgIyBOb3cgd2UgaGF2ZSB0byBjdXQgaXQgaW4gc3VjaCBhIHdheSxcclxuICAgICAgIyB0aGF0IHRoZSBzZWxlY3Rpb24gZG9lcyBub3QgaW50ZXJzZWN0IHdpdGggJHRvIGFueW1vcmUuXHJcblxyXG4gICAgICAjIHRoaXMgaXMgYSByZWZlcmVuY2UgZm9yIHRoZSBzZWxlY3Rpb25zIHRoYXQgYXJlIGNyZWF0ZWQvbW9kaWZpZWQ6XHJcbiAgICAgICMgaXQgaXMgc2ltaWxhciB0byB0aGUgb25lIGFib3ZlLCBleGNlcHQgdGhhdCB3ZSBkbyBub3QgbmVlZCBvcHRfc2VsZWN0aW9uIGFueW1vcmUhXHJcbiAgICAgICMgb2xkX3NlbGVjdGlvbiBpcyBpbm5lciAoYmV0d2VlbiAkZnJvbSBhbmQgJHRvKVxyXG4gICAgICAjICAgLSB3aWxsIGJlIGNoYW5nZWQgaW4gc3VjaCBhIHdheSB0aGF0IGl0IGlzIHRvIHRoZSBsZWZ0IG9mICR0b1xyXG4gICAgICAjIG5ld19zZWxlY3Rpb24gaXMgb3V0ZXIgKCBvdXRlciAkZnJvbSBhbmQgJHRvKVxyXG4gICAgICAjICAgLSBjcmVhdGVkLCByaWdodCBhZnRlciAkdG9cclxuICAgICAgb2xkX3NlbGVjdGlvbiA9IG8uc2VsZWN0aW9uXHJcblxyXG4gICAgICAjIGNyZWF0ZSAkbmV3X3NlbGVjdGlvblxyXG4gICAgICBuZXdfc2VsZWN0aW9uID0gY3JlYXRlU2VsZWN0aW9uIHRvLmdldE5leHQoKSwgb2xkX3NlbGVjdGlvbi50bywgb2xkX3NlbGVjdGlvbi5hdHRyc1xyXG5cclxuICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlc1xyXG4gICAgICBvbGRfc2VsZWN0aW9uLnRvID0gdG9cclxuICAgICAgIyB1cGRhdGUgcmVmZXJlbmNlcyAocG9pbnRlcnMgdG8gcmVzcGVjdGl2ZSBzZWxlY3Rpb25zKVxyXG4gICAgICBvbGRfc2VsZWN0aW9uLnRvLnNlbGVjdGlvbiA9IG9sZF9zZWxlY3Rpb25cclxuXHJcbiAgICAgIG5ld19zZWxlY3Rpb24uZnJvbS5zZWxlY3Rpb24gPSBuZXdfc2VsZWN0aW9uXHJcbiAgICAgIG5ld19zZWxlY3Rpb24udG8uc2VsZWN0aW9uID0gbmV3X3NlbGVjdGlvblxyXG5cclxuICAgIGN1dF9vZmZfdG8oKVxyXG5cclxuICAgIGRlbHRhX2hhc19hdHRycyA9IGZhbHNlXHJcbiAgICBmb3IgYSBvZiBkZWx0YS5hdHRyc1xyXG4gICAgICBkZWx0YV9oYXNfYXR0cnMgPSB0cnVlXHJcbiAgICAgIGJyZWFrXHJcbiAgICAjIDMuIGV4dGVuZCAvIGFkZCBzZWxlY3Rpb25zIGluIGJldHdlZW5cclxuICAgIG8gPSBmcm9tXHJcbiAgICB0b19uZXh0ID0gdG8uZ2V0TmV4dCgpXHJcbiAgICB3aGlsZSAobyBpc250IHRvX25leHQpXHJcbiAgICAgIGlmIG8uc2VsZWN0aW9uP1xyXG4gICAgICAgICMganVzdCBleHRlbmQgdGhlIGV4aXN0aW5nIHNlbGVjdGlvblxyXG4gICAgICAgIGV4dGVuZFNlbGVjdGlvbiBvLnNlbGVjdGlvbiwgZGVsdGEgIyB3aWxsIHB1c2ggdW5kby1kZWx0YXMgdG8gJHVuZG9zXHJcbiAgICAgICAgc2VsZWN0aW9uID0gby5zZWxlY3Rpb25cclxuICAgICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgc2VsZWN0aW9uXHJcblxyXG4gICAgICAgIG8gPSBzZWxlY3Rpb24udG8uZ2V0TmV4dCgpXHJcbiAgICAgICAgc2VsZWN0aW9uX2lzX2VtcHR5ID0gdHJ1ZVxyXG4gICAgICAgIGZvciBhdHRyIG9mIHNlbGVjdGlvbi5hdHRyc1xyXG4gICAgICAgICAgc2VsZWN0aW9uX2lzX2VtcHR5ID0gZmFsc2VcclxuICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgaWYgc2VsZWN0aW9uX2lzX2VtcHR5XHJcbiAgICAgICAgICBAX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlIHNlbGVjdGlvblxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgIyBjcmVhdGUgYSBuZXcgc2VsZWN0aW9uICh1bnRpbCB5b3UgZmluZCB0aGUgbmV4dCBvbmUpXHJcbiAgICAgICAgc3RhcnQgPSBvXHJcbiAgICAgICAgb19uZXh0ID0gby5nZXROZXh0KClcclxuICAgICAgICB3aGlsZSAobm90IG9fbmV4dC5zZWxlY3Rpb24/KSBhbmQgKG8gaXNudCB0bylcclxuICAgICAgICAgIG8gPSBvX25leHRcclxuICAgICAgICAgIG9fbmV4dCA9IG8uZ2V0TmV4dCgpXHJcbiAgICAgICAgZW5kID0gb1xyXG4gICAgICAgIGlmIGRlbHRhLnR5cGUgaXNudCBcInVuc2VsZWN0XCIgYW5kIGRlbHRhX2hhc19hdHRyc1xyXG4gICAgICAgICAgYXR0cl9saXN0ID0gW11cclxuICAgICAgICAgIGZvciBuLHYgb2YgZGVsdGEuYXR0cnNcclxuICAgICAgICAgICAgYXR0cl9saXN0LnB1c2ggblxyXG4gICAgICAgICAgdW5kb3MucHVzaFxyXG4gICAgICAgICAgICBmcm9tOiBzdGFydFxyXG4gICAgICAgICAgICB0bzogZW5kXHJcbiAgICAgICAgICAgIGF0dHJzOiBhdHRyX2xpc3RcclxuICAgICAgICAgICAgdHlwZTogXCJ1bnNlbGVjdFwiXHJcbiAgICAgICAgICBzZWxlY3Rpb24gPSBjcmVhdGVTZWxlY3Rpb24gc3RhcnQsIGVuZCwgZGVsdGEuYXR0cnNcclxuICAgICAgICAgIHN0YXJ0LnNlbGVjdGlvbiA9IHNlbGVjdGlvblxyXG4gICAgICAgICAgZW5kLnNlbGVjdGlvbiA9IHNlbGVjdGlvblxyXG4gICAgICAgICAgQF9jb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0IG8uc2VsZWN0aW9uXHJcbiAgICAgICAgbyA9IG8uZ2V0TmV4dCgpXHJcblxyXG4gICAgaWYgby5zZWxlY3Rpb24/XHJcbiAgICAgICMgYW5kIGNoZWNrIGlmIHlvdSBjYW4gY29tYmluZSBvLnNlbGVjdGlvblxyXG4gICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgby5zZWxlY3Rpb25cclxuICAgICMgYWxzbyByZS1jb25uZWN0IGZyb21cclxuICAgIGlmIGZyb20uc2VsZWN0aW9uP1xyXG4gICAgICBAX2NvbWJpbmVfc2VsZWN0aW9uX3RvX2xlZnQgZnJvbS5zZWxlY3Rpb25cclxuXHJcbiAgICByZXR1cm4gdW5kb3MgIyBpdCBpcyBuZWNlc3NhcnkgdGhhdCBkZWx0YSBpcyByZXR1cm5lZCBpbiB0aGUgd2F5IGl0IHdhcyBhcHBsaWVkIG9uIHRoZSBnbG9iYWwgZGVsdGEuXHJcbiAgICAjIHNvIHRoYXQgeWpzIGtub3dzIGV4YWN0bHkgd2hhdCB3YXMgYXBwbGllZCAoYW5kIGhvdyB0byB1bmRvIGl0KS5cclxuXHJcbiAgX3JlbW92ZUZyb21Db21wb3NpdGlvblZhbHVlOiAoc2VsKS0+XHJcbiAgICBAX2NvbXBvc2l0aW9uX3ZhbHVlID0gQF9jb21wb3NpdGlvbl92YWx1ZS5maWx0ZXIgKG8pLT5cclxuICAgICAgbyBpc250IHNlbFxyXG4gICAgZGVsZXRlIHNlbC5mcm9tLnNlbGVjdGlvblxyXG4gICAgZGVsZXRlIHNlbC50by5zZWxlY3Rpb25cclxuXHJcbiAgIyB0cnkgdG8gY29tYmluZSBhIHNlbGVjdGlvbiwgdG8gdGhlIHNlbGVjdGlvbiB0byBpdHMgbGVmdCAoaWYgdGhlcmUgaXMgYW55KVxyXG4gIF9jb21iaW5lX3NlbGVjdGlvbl90b19sZWZ0OiAoc2VsKS0+XHJcbiAgICBmaXJzdF9vID0gc2VsLmZyb20uZ2V0UHJldigpXHJcbiAgICBpZiBub3QgZmlyc3Rfby5zZWxlY3Rpb24/XHJcbiAgICAgICMgdGhlcmUgaXMgbm8gc2VsZWN0aW9uIHRvIHRoZSBsZWZ0XHJcbiAgICAgIHJldHVyblxyXG4gICAgZWxzZVxyXG4gICAgICBpZiBjb21wYXJlX29iamVjdHMoZmlyc3Rfby5zZWxlY3Rpb24uYXR0cnMsIHNlbC5hdHRycylcclxuICAgICAgICAjIHdlIGFyZSBnb2luZyB0byByZW1vdmUgdGhlIGxlZnQgc2VsZWN0aW9uXHJcbiAgICAgICAgIyBGaXJzdCwgcmVtb3ZlIGV2ZXJ5IHRyYWNlIG9mIGZpcnN0X28uc2VsZWN0aW9uIChzYXZlIHdoYXQgaXMgbmVjZXNzYXJ5KVxyXG4gICAgICAgICMgVGhlbiwgcmUtc2V0IHNlbC5mcm9tXHJcbiAgICAgICAgI1xyXG4gICAgICAgIG5ld19mcm9tID0gZmlyc3Rfby5zZWxlY3Rpb24uZnJvbVxyXG4gICAgICAgIEBfcmVtb3ZlRnJvbUNvbXBvc2l0aW9uVmFsdWUgZmlyc3Rfby5zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgaWYgc2VsLmZyb20gaXNudCBzZWwudG9cclxuICAgICAgICAgIGRlbGV0ZSBzZWwuZnJvbS5zZWxlY3Rpb25cclxuXHJcbiAgICAgICAgc2VsLmZyb20gPSBuZXdfZnJvbVxyXG4gICAgICAgIG5ld19mcm9tLnNlbGVjdGlvbiA9IHNlbFxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuXHJcblxyXG4gICMgXCJ1bmRvXCIgYSBkZWx0YSBmcm9tIHRoZSBjb21wb3NpdGlvbl92YWx1ZVxyXG4gIF91bmFwcGx5OiAoZGVsdGFzKS0+XHJcbiAgICAjIF9hcHBseSByZXR1cm5zIGEgX2xpc3RfIG9mIGRlbHRhcywgdGhhdCBhcmUgbmVjY2Vzc2FyeSB0byB1bmRvIHRoZSBjaGFuZ2UuIE5vdyB3ZSBfYXBwbHkgZXZlcnkgZGVsdGEgaW4gdGhlIGxpc3QgKGFuZCBkaXNjYXJkIHRoZSByZXN1bHRzKVxyXG4gICAgZm9yIGRlbHRhIGluIGRlbHRhc1xyXG4gICAgICBAX2FwcGx5IGRlbHRhXHJcbiAgICByZXR1cm5cclxuXHJcbiAgIyB1cGRhdGUgdGhlIGdsb2JhbERlbHRhIHdpdGggZGVsdGFcclxuXHJcblxyXG4gICMgc2VsZWN0IF9mcm9tXywgX3RvXyB3aXRoIGFuIF9hdHRyaWJ1dGVfXHJcbiAgc2VsZWN0OiAoZnJvbSwgdG8sIGF0dHJzLCBvdmVyd3JpdGUpLT5cclxuICAgIGxlbmd0aCA9IDBcclxuICAgIGZvciBhIG9mIGF0dHJzXHJcbiAgICAgIGxlbmd0aCsrXHJcbiAgICAgIGJyZWFrXHJcbiAgICBpZiBsZW5ndGggPD0gMCBhbmQgbm90IChvdmVyd3JpdGU/IGFuZCBvdmVyd3JpdGUpXHJcbiAgICAgIHJldHVyblxyXG5cclxuICAgIGRlbHRhX29wZXJhdGlvbnMgPVxyXG4gICAgICBmcm9tOiBmcm9tXHJcbiAgICAgIHRvOiB0b1xyXG5cclxuICAgIGRlbHRhID1cclxuICAgICAgYXR0cnM6IGF0dHJzXHJcbiAgICAgIHR5cGU6IFwic2VsZWN0XCJcclxuXHJcbiAgICBpZiBvdmVyd3JpdGU/IGFuZCBvdmVyd3JpdGVcclxuICAgICAgZGVsdGEub3ZlcndyaXRlID0gdHJ1ZVxyXG5cclxuICAgIEBfbW9kZWwuYXBwbHlEZWx0YShkZWx0YSwgZGVsdGFfb3BlcmF0aW9ucylcclxuXHJcbiAgdW5zZWxlY3RBbGw6IChmcm9tLCB0byktPlxyXG4gICAgc2VsZWN0IGZyb20sIHRvLCB7fSwgdHJ1ZVxyXG5cclxuICAjIHVuc2VsZWN0IF9mcm9tXywgX3RvXyB3aXRoIGFuIF9hdHRyaWJ1dGVfXHJcbiAgdW5zZWxlY3Q6IChmcm9tLCB0bywgYXR0cnMpLT5cclxuICAgIGlmIHR5cGVvZiBhdHRycyBpcyBcInN0cmluZ1wiXHJcbiAgICAgIGF0dHJzID0gW2F0dHJzXVxyXG4gICAgaWYgYXR0cnMuY29uc3RydWN0b3IgaXNudCBBcnJheVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJZLlNlbGVjdGlvbnMucHJvdG90eXBlLnVuc2VsZWN0IGV4cGVjdHMgYW4gQXJyYXkgb3IgU3RyaW5nIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXIgKGF0dHJpYnV0ZXMpIVwiXHJcbiAgICBpZiBhdHRycy5sZW5ndGggPD0gMFxyXG4gICAgICByZXR1cm5cclxuICAgIGRlbHRhX29wZXJhdGlvbnMgPVxyXG4gICAgICBmcm9tOiBmcm9tXHJcbiAgICAgIHRvOiB0b1xyXG4gICAgZGVsdGEgPVxyXG4gICAgICBhdHRyczogYXR0cnNcclxuICAgICAgdHlwZTogXCJ1bnNlbGVjdFwiXHJcblxyXG4gICAgQF9tb2RlbC5hcHBseURlbHRhKGRlbHRhLCBkZWx0YV9vcGVyYXRpb25zKVxyXG5cclxuICAjICogZ2V0IGFsbCB0aGUgc2VsZWN0aW9ucyBvZiBhIHktbGlzdFxyXG4gICMgKiB0aGlzIHdpbGwgYWxzbyB0ZXN0IGlmIHRoZSBzZWxlY3Rpb25zIGFyZSB3ZWxsIGZvcm1lZCAoYWZ0ZXIgJGZyb20gZm9sbG93cyAkdG8gZm9sbG93cyAkZnJvbSAuLilcclxuICBnZXRTZWxlY3Rpb25zOiAobGlzdCktPlxyXG4gICAgbyA9IGxpc3QucmVmKDApXHJcbiAgICBpZiBub3Qgbz9cclxuICAgICAgcmV0dXJuIFtdXHJcblxyXG4gICAgc2VsX3N0YXJ0ID0gbnVsbFxyXG4gICAgcG9zID0gMFxyXG4gICAgcmVzdWx0ID0gW11cclxuXHJcbiAgICB3aGlsZSBvLm5leHRfY2w/XHJcbiAgICAgIGlmIG8uaXNEZWxldGVkKClcclxuICAgICAgICBpZiBvLnNlbGVjdGlvbj9cclxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiWW91IGZvcmdvdCB0byBkZWxldGUgdGhlIHNlbGVjdGlvbiBmcm9tIHRoaXMgb3BlcmF0aW9uISBQbGVhc2Ugd3JpdGUgYW4gaXNzdWUgaG93IHRvIHJlcHJvZHVjZSB0aGlzIGJ1ZyEgKGl0IGNvdWxkIGxlYWQgdG8gaW5jb25zaXN0ZW5jaWVzISlcIlxyXG4gICAgICAgIG8gPSBvLm5leHRfY2xcclxuICAgICAgICBjb250aW51ZVxyXG4gICAgICBpZiBvLnNlbGVjdGlvbj9cclxuICAgICAgICBpZiBvLnNlbGVjdGlvbi5mcm9tIGlzIG9cclxuICAgICAgICAgIGlmIHNlbF9zdGFydD9cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiRm91bmQgdHdvIGNvbnNlY3V0aXZlIGZyb20gZWxlbWVudHMuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzZWxfc3RhcnQgPSBwb3NcclxuICAgICAgICBpZiBvLnNlbGVjdGlvbi50byBpcyBvXHJcbiAgICAgICAgICBpZiBzZWxfc3RhcnQ/XHJcbiAgICAgICAgICAgIG51bWJlcl9vZl9hdHRycyA9IDBcclxuICAgICAgICAgICAgYXR0cnMgPSB7fVxyXG4gICAgICAgICAgICBmb3Igbix2IG9mIG8uc2VsZWN0aW9uLmF0dHJzXHJcbiAgICAgICAgICAgICAgYXR0cnNbbl0gPSB2XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoXHJcbiAgICAgICAgICAgICAgZnJvbTogc2VsX3N0YXJ0XHJcbiAgICAgICAgICAgICAgdG86IHBvc1xyXG4gICAgICAgICAgICAgIGF0dHJzOiBhdHRyc1xyXG4gICAgICAgICAgICBzZWxfc3RhcnQgPSBudWxsXHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciBcIkZvdW5kIHR3byBjb25zZWN1dGl2ZSB0byBlbGVtZW50cy4gVGhlIHNlbGVjdGlvbnMgYXJlIG5vIGxvbmdlciBzYWZlIHRvIHVzZSEgKGNvbnRhY3QgdGhlIG93bmVyIG9mIHRoZSByZXBvc2l0b3J5KVwiXHJcbiAgICAgICAgZWxzZSBpZiBvLnNlbGVjdGlvbi5mcm9tIGlzbnQgb1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVGhpcyByZWZlcmVuY2Ugc2hvdWxkIG5vdCBwb2ludCB0byB0aGlzIHNlbGVjdGlvbiwgYmVjYXVzZSB0aGUgc2VsZWN0aW9uIGRvZXMgbm90IHBvaW50IHRvIHRoZSByZWZlcmVuY2UuIFRoZSBzZWxlY3Rpb25zIGFyZSBubyBsb25nZXIgc2FmZSB0byB1c2UhIChjb250YWN0IHRoZSBvd25lciBvZiB0aGUgcmVwb3NpdG9yeSlcIlxyXG4gICAgICBwb3MrK1xyXG4gICAgICBvID0gby5uZXh0X2NsXHJcbiAgICByZXR1cm4gcmVzdWx0XHJcblxyXG4gIG9ic2VydmU6IChmKS0+XHJcbiAgICBAX2xpc3RlbmVycy5wdXNoIGZcclxuXHJcbiAgdW5vYnNlcnZlOiAoZiktPlxyXG4gICAgQF9saXN0ZW5lcnMgPSBAX2xpc3RlbmVycy5maWx0ZXIgKGcpLT5cclxuICAgICAgZiAhPSBnXHJcblxyXG5cclxuaWYgd2luZG93P1xyXG4gIGlmIHdpbmRvdy5ZP1xyXG4gICAgd2luZG93LlkuU2VsZWN0aW9ucyA9IFlTZWxlY3Rpb25zXHJcbiAgZWxzZVxyXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiWW91IG11c3QgZmlyc3QgaW1wb3J0IFkhXCJcclxuXHJcbmlmIG1vZHVsZT9cclxuICBtb2R1bGUuZXhwb3J0cyA9IFlTZWxlY3Rpb25zXHJcbiJdfQ==
