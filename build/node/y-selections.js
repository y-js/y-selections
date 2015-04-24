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
      var j, len, ref1, results;
      ref1 = this._composition_value;
      results = [];
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        v = ref1[i];
        composition_value_operations["" + i + "/from"] = v.from;
        composition_value_operations["" + i + "/to"] = v.to;
        results.push({
          attrs: v.attrs
        });
      }
      return results;
    }).call(this);
    return {
      composition_value: composition_value,
      composition_value_operations: composition_value_operations
    };
  };

  YSelections.prototype._setCompositionValue = function(composition_value) {
    var j, len, results, v;
    results = [];
    for (j = 0, len = composition_value.length; j < len; j++) {
      v = composition_value[j];
      v.type = "select";
      results.push(this._apply(v));
    }
    return results;
  };

  YSelections.prototype._apply = function(delta) {
    var a, attr, attr_list, createSelection, cut_off_from, cut_off_to, delta_has_attrs, end, extendSelection, from, j, k, l, len, len1, n, o, o_next, observer_call, p, parent, parent_exists, ref1, ref2, ref3, selection, selection_is_empty, start, to, to_next, undos, v;
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
      ref1 = this._lists;
      for (j = 0, len = ref1.length; j < len; j++) {
        p = ref1[j];
        if (parent === this._lists[p]) {
          parent_exists = true;
          break;
        }
      }
      if (!parent_exists) {
        this._lists.push(parent);
        parent.observe((function(_this) {
          return function(events) {
            var event, k, len1, next, prev, ref, results, sel;
            results = [];
            for (k = 0, len1 = events.length; k < len1; k++) {
              event = events[k];
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
                  results.push(_this._combine_selection_to_left(next.selection));
                } else {
                  results.push(void 0);
                }
              } else {
                results.push(void 0);
              }
            }
            return results;
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
    ref2 = this._listeners;
    for (k = 0, len1 = ref2.length; k < len1; k++) {
      l = ref2[k];
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
      var len2, m, n, ref3, ref4, ref5, undo_attrs, undo_attrs_list, undo_need_select, undo_need_unselect, v;
      if (delta.type === "unselect") {
        undo_attrs = {};
        ref3 = delta.attrs;
        for (m = 0, len2 = ref3.length; m < len2; m++) {
          n = ref3[m];
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
          ref4 = selection.attrs;
          for (n in ref4) {
            v = ref4[n];
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
        ref5 = delta.attrs;
        for (n in ref5) {
          v = ref5[n];
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
          ref3 = delta.attrs;
          for (n in ref3) {
            v = ref3[n];
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
    var delta, j, len;
    for (j = 0, len = deltas.length; j < len; j++) {
      delta = deltas[j];
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
    var attrs, n, number_of_attrs, o, pos, ref1, result, sel_start, v;
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
            ref1 = o.selection.attrs;
            for (n in ref1) {
              v = ref1[n];
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
