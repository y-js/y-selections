var YSelections;

YSelections = (function() {
  function YSelections() {}

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

  YSelections.prototype._apply = function(delta) {
    var createSelection, cut_off_from, cut_off_to, end, extendSelection, from, o, selection, start, to;
    from = this._model.HB.getOperation(delta.from);
    to = this._model.HB.getOperation(delta.to);
    createSelection = function(from, to, attrs) {
      var n, new_attrs, v;
      new_attrs = {};
      for (n in attrs) {
        v = attrs[n];
        new_attrs[n] = v;
      }
      return {
        from: from,
        to: to,
        attrs: new_attrs
      };
    };
    extendSelection = function(selection) {
      var i, len, n, ref, ref1, results, results1, v;
      if (delta.type === "unselect") {
        ref = delta.attrs;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          n = ref[i];
          results.push(delete selection.attrs[n]);
        }
        return results;
      } else {
        ref1 = delta.attrs;
        results1 = [];
        for (n in ref1) {
          v = ref1[n];
          results1.push(selection.attrs[n] = v);
        }
        return results1;
      }
    };
    if (!((from != null) && (to != null))) {
      console.log("wasn't able to apply the selection..");
    }
    cut_off_from = function() {
      var new_selection, o, old_selection, opt_selection;
      if ((from.selection != null) && from.selection.from === from) {
        return;
      }
      o = from.prev_cl;
      while ((o.selection == null) && (o.type !== "Delimiter")) {
        o = o.prev_cl;
      }
      if ((o.selection == null) || o.selection.to === o) {
        return;
      }
      old_selection = o.selection;
      o = from;
      while ((o !== old_selection.to) && (o !== to)) {
        o = o.next_cl;
      }
      if (o === old_selection.to) {
        new_selection = createSelection(from, old_selection.to, old_selection.attrs);
        old_selection.to = from.prev_cl;
        old_selection.to.selection = old_selection;
        extendSelection(new_selection, delta);
        new_selection.from.selection = new_selection;
        return new_selection.to.selection = new_selection;
      } else {
        new_selection = createSelection(from, to, old_selection.attrs);
        opt_selection = createSelection(to.next_cl, old_selection.to, old_selection.attrs);
        old_selection.to = from.prev_cl;
        old_selection.to.selection = old_selection;
        opt_selection.from.selection = opt_selection;
        opt_selection.to.selection = opt_selection;
        extendSelection(new_selection, delta);
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
        o = o.prev_cl;
      }
      if ((o.selection == null) || o.selection["to"] === o) {
        return;
      }
      old_selection = o.selection;
      new_selection = createSelection(to.next_cl, old_selection.to, old_selection.attrs);
      extendSelection(old_selection, delta);
      old_selection.to = to;
      old_selection.to.selection = old_selection;
      new_selection.from.selection = new_selection;
      return new_selection.to.selection = new_selection;
    };
    cut_off_to();
    o = from;
    while (o !== to.next_cl) {
      if (o.selection != null) {
        console.log("1");
        extendSelection(o.selection, delta);
        o = o.selection.to.next_cl;
      } else {
        console.log("2");
        start = o;
        while ((o.next_cl.selection == null) && (o !== to)) {
          o = o.next_cl;
        }
        end = o;
        selection = createSelection(start, end, delta.attrs);
        start.selection = selection;
        end.selection = selection;
        o = o.next_cl;
      }
    }
    return delta;
  };

  YSelections.prototype._unapply = function(delta) {
    var from, to;
    from = this._model.HB.getOperation(delta.from);
    to = this._model.HB.getOperation(delta.to);
    if (!((from != null) && (to != null))) {
      console.log("wasn't able to unapply the selection..");
    }
    if (delta.type === "select") {
      delete from.selection;
      return delete to.selection;
    } else if (delta.type === "unselect") {

    } else {
      throw new Error("unsupported delta!");
    }
  };

  YSelections.prototype.select = function(from, to, attrs) {
    var delta;
    delta = {
      from: from.getUid(),
      to: to.getUid(),
      attrs: attrs,
      type: "select"
    };
    return this._model.applyDelta(delta);
  };

  YSelections.prototype.unselect = function(from, to, attrs) {
    var delta;
    if (typeof attrs === "string") {
      attrs = [attrs];
    }
    if (attrs.constructor !== Array) {
      throw new Error("Y.Selections.prototype.unselect expects an Array or String as the third parameter (attributes)!");
    }
    delta = {
      from: from.getUid(),
      to: to.getUid(),
      attrs: attrs,
      type: "unselect"
    };
    return this._model.applyDelta(delta);
  };

  YSelections.prototype.observe = function(f) {
    return this._model.observe(f);
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
