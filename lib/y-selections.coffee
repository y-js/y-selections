
# compare two object for equality (no deep check!)
compare_objects = (o, p, doAgain=true)->
  for n,v of o
    if not (p[n]? and p[n] is v)
      return false
  if doAgain
    compare_objects(p,o,false)
  else
    true


class YSelections
  constructor: ()->
    @_listeners = []
    @_composition_value = []
    # we put all the lists we use in this array
    @_lists = []

  _name: "Selections"

  _getModel: (Y, Operation) ->
    if not @_model?
      @_model = new Operation.Composition(@, []).execute()
    @_model

  _setModel: (@_model)->

  _getCompositionValue: ()->
    composition_value_operations = {}
    composition_value = for v,i in @_composition_value
      composition_value_operations[""+i+"/from"] = v.from
      composition_value_operations[""+i+"/to"] = v.to
      {
        attrs: v.attrs
      }

    return {
      composition_value : composition_value
      composition_value_operations: composition_value_operations
    }


  _setCompositionValue: (composition_value)->
    for v in composition_value
      v.type = "select"
      @_apply v

  _apply: (delta)->
    undos = [] # list of deltas that are necessary to undo the change

    if delta.from.isDeleted()
      delta.from = delta.from.getNext()
    if delta.to.isDeleted()
      delta.to = delta.to.getPrev()

    from = delta.from
    to = delta.to
    if from.getPrev() is to
      # There is nothing to select anymore!
      return undos


    #
    # Assuming $from is deleted at some point. We need to change the selection
    # _before_ the GC removes it completely from the list. Therefore, we listen to
    # "delete" events, and if that particular operation has a selection
    # (o.sselection?) we move the selection to the next undeleted operation, if
    # any. It also handles the case that there is nothing to select anymore (e.g.
    # everything inside the selection is deleted). Then we remove the selection
    # completely
    #
    # if never applied a delta on this list, add a listener to it in order to change selections if necessary
    if delta.type is "select"
      parent = from.getParent()
      parent_exists = false
      for p in @_lists
        if parent is @_lists[p]
          parent_exists = true
          break
      if not parent_exists
        @_lists.push parent
        parent.observe (events)=>
          for event in events
            if event.type is "delete"
              if event.reference.selection?
                ref = event.reference
                sel = ref.selection
                delete ref.selection # delete it, because ref is going to get deleted!
                if sel.from is ref and sel.to is ref
                  @_removeFromCompositionValue sel
                else if sel.from is ref
                  prev = ref.getNext()
                  sel.from = prev
                  prev.selection = sel
                else if sel.to is ref
                  next = ref.getPrev()
                  sel.to = next
                  next.selection = sel
                else
                  throw new Error "Found weird inconsistency! Y.Selections is no longer safe to use!"
              next = event.reference.getNext()
              if next.selection?
                @_combine_selection_to_left next.selection

    # notify listeners:
    observer_call =
      from: from
      to: to
      type: delta.type
      attrs: delta.attrs
    for l in @_listeners
      l.call this, observer_call
    createSelection = (from, to, attrs)=>
      new_attrs = {}
      for n,v of attrs
        new_attrs[n] = v
      new_sel = {
        from: from
        to: to
        attrs: new_attrs
      }
      @_composition_value.push new_sel
      new_sel

    extendSelection = (selection)->
      if delta.type is "unselect"
        undo_attrs = {}
        for n in delta.attrs
          if selection.attrs[n]?
            undo_attrs[n] = selection.attrs[n]
          delete selection.attrs[n]
        undos.push
          from: delta.from
          to: delta.to
          attrs: undo_attrs
          type: "select"
      else
        undo_attrs = {} # for undo selection (overwrite of existing selection)
        undo_attrs_list = [] # for undo selection (not overwrite)
        undo_need_unselect = false
        undo_need_select = false
        if delta.overwrite? and delta.overwrite
          # overwrite everything that the delta doesn't expect
          for n,v of selection.attrs
            if not delta.attrs[n]?
              undo_need_select = true
              undo_attrs[n] = v
              # must not delete attributes of $selection.attrs in this loop,
              # so we do it in the next one
          for n,v of undo_attrs
            delete selection.attrs[n]

        # apply the delta on the selection
        for n,v of delta.attrs
          if selection.attrs[n]?
            undo_attrs[n] = selection.attrs[n]
            undo_need_select = true
          else
            undo_attrs_list.push n
            undo_need_unselect = true
          selection.attrs[n] = v
        if undo_need_select
          undos.push
            from: selection.from
            to: selection.to
            attrs: undo_attrs
            type: "select"
        if undo_need_unselect
          undos.push
            from: selection.from
            to: selection.to
            attrs: undo_attrs_list
            type: "unselect"

    # Algorithm overview:
    # 1. cut off the selection that intersects with from
    # 2. cut off the selection that intersects with to
    # 3. extend / add selections inbetween
    #
    #### 1. cut off the selection that intersects with from
    #
    cut_off_from = ()->
      # check if a selection (to the left of $from) intersects with $from
      if from.selection? and from.selection.from is from
        # does not intersect, because the start is already selected
        return
      # find first selection to the left
      o = from.getPrev()
      while (not o.selection?) and (o.type isnt "Delimiter")
        o = o.getPrev()
      if (not o.selection?) or o.selection.to is o
        # no intersection
        return
      # We found a selection that intersects with $from.
      # Now we have to check if it also intersects with $to.
      # Then we cut it in such a way,
      # that the selection does not intersect with $from and $to anymore.

      # this is a reference for the selections that are created/modified:
      # old_selection is outer (not between $from $to)
      #   - will be changed in such a way that it is to the left of $from
      # new_selection is inner (inbetween $from $to)
      #   - created, right after $from
      # opt_selection is outer (after $to)
      #   - created (if necessary), right after $to
      old_selection = o.selection

      # check if found selection also intersects with $to
      # * starting from $from, go to the right until you found either $to or old_selection.to
      # ** if $to: no intersection with $to
      # ** if $old_selection.to: intersection with $to!
      o = from
      while (o isnt old_selection.to) and (o isnt to)
        o = o.getNext()

      if o is old_selection.to
        # no intersection with to!
        # create $new_selection
        new_selection = createSelection from, old_selection.to, old_selection.attrs

        # update references
        old_selection.to = from.getPrev()
        # update references (pointers to respective selections)
        old_selection.to.selection = old_selection

        new_selection.from.selection = new_selection
        new_selection.to.selection = new_selection
      else
        # there is an intersection with to!

        # create $new_selection
        new_selection = createSelection from, to, old_selection.attrs

        # create $opt_selection
        opt_selection = createSelection to.getNext(), old_selection.to, old_selection.attrs

        # update references
        old_selection.to = from.getPrev()
        # update references (pointers to respective selections)
        old_selection.to.selection = old_selection

        opt_selection.from.selection = opt_selection
        opt_selection.to.selection = opt_selection

        new_selection.from.selection = new_selection
        new_selection.to.selection = new_selection


    cut_off_from()

    # 2. cut off the selection that intersects with $to
    cut_off_to = ()->
      # check if a selection (to the left of $to) intersects with $to
      if to.selection? and to.selection.to is to
        # does not intersect, because the end is already selected
        return
      # find first selection to the left
      o = to
      while (not o.selection?) and (o isnt from)
        o = o.getPrev()
      if (not o.selection?) or o.selection["to"] is o
        # no intersection
        return
      # We found a selection that intersects with $to.
      # Now we have to cut it in such a way,
      # that the selection does not intersect with $to anymore.

      # this is a reference for the selections that are created/modified:
      # it is similar to the one above, except that we do not need opt_selection anymore!
      # old_selection is inner (between $from and $to)
      #   - will be changed in such a way that it is to the left of $to
      # new_selection is outer ( outer $from and $to)
      #   - created, right after $to
      old_selection = o.selection

      # create $new_selection
      new_selection = createSelection to.getNext(), old_selection.to, old_selection.attrs

      # update references
      old_selection.to = to
      # update references (pointers to respective selections)
      old_selection.to.selection = old_selection

      new_selection.from.selection = new_selection
      new_selection.to.selection = new_selection

    cut_off_to()

    delta_has_attrs = false
    for a of delta.attrs
      delta_has_attrs = true
      break
    # 3. extend / add selections in between
    o = from
    to_next = to.getNext()
    while (o isnt to_next)
      if o.selection?
        # just extend the existing selection
        extendSelection o.selection, delta # will push undo-deltas to $undos
        selection = o.selection
        @_combine_selection_to_left selection

        o = selection.to.getNext()
        selection_is_empty = true
        for attr of selection.attrs
          selection_is_empty = false
          break
        if selection_is_empty
          @_removeFromCompositionValue selection
      else
        # create a new selection (until you find the next one)
        start = o
        o_next = o.getNext()
        while (not o_next.selection?) and (o isnt to)
          o = o_next
          o_next = o.getNext()
        end = o
        if delta.type isnt "unselect" and delta_has_attrs
          attr_list = []
          for n,v of delta.attrs
            attr_list.push n
          undos.push
            from: start
            to: end
            attrs: attr_list
            type: "unselect"
          selection = createSelection start, end, delta.attrs
          start.selection = selection
          end.selection = selection
          @_combine_selection_to_left o.selection
        o = o.getNext()

    if o.selection?
      # and check if you can combine o.selection
      @_combine_selection_to_left o.selection
    # also re-connect from
    if from.selection?
      @_combine_selection_to_left from.selection

    return undos # it is necessary that delta is returned in the way it was applied on the global delta.
    # so that yjs knows exactly what was applied (and how to undo it).

  _removeFromCompositionValue: (sel)->
    @_composition_value = @_composition_value.filter (o)->
      o isnt sel
    delete sel.from.selection
    delete sel.to.selection

  # try to combine a selection, to the selection to its left (if there is any)
  _combine_selection_to_left: (sel)->
    first_o = sel.from.getPrev()
    if not first_o.selection?
      # there is no selection to the left
      return
    else
      if compare_objects(first_o.selection.attrs, sel.attrs)
        # we are going to remove the left selection
        # First, remove every trace of first_o.selection (save what is necessary)
        # Then, re-set sel.from
        #
        new_from = first_o.selection.from
        @_removeFromCompositionValue first_o.selection

        if sel.from isnt sel.to
          delete sel.from.selection

        sel.from = new_from
        new_from.selection = sel
      else
        return

  # "undo" a delta from the composition_value
  _unapply: (deltas)->
    # _apply returns a _list_ of deltas, that are neccessary to undo the change. Now we _apply every delta in the list (and discard the results)
    for delta in deltas
      @_apply delta
    return

  # update the globalDelta with delta


  # select _from_, _to_ with an _attribute_
  select: (from, to, attrs, overwrite)->
    length = 0
    for a of attrs
      length++
      break
    if length <= 0 and not (overwrite? and overwrite)
      return

    delta_operations =
      from: from
      to: to

    delta =
      attrs: attrs
      type: "select"

    if overwrite? and overwrite
      delta.overwrite = true

    @_model.applyDelta(delta, delta_operations)

  unselectAll: (from, to)->
    select from, to, {}, true

  # unselect _from_, _to_ with an _attribute_
  unselect: (from, to, attrs)->
    if typeof attrs is "string"
      attrs = [attrs]
    if attrs.constructor isnt Array
      throw new Error "Y.Selections.prototype.unselect expects an Array or String as the third parameter (attributes)!"
    if attrs.length <= 0
      return
    delta_operations =
      from: from
      to: to
    delta =
      attrs: attrs
      type: "unselect"

    @_model.applyDelta(delta, delta_operations)

  # * get all the selections of a y-list
  # * this will also test if the selections are well formed (after $from follows $to follows $from ..)
  getSelections: (list)->
    o = list.ref(0)
    if not o?
      return []

    sel_start = null
    pos = 0
    result = []

    while o.next_cl?
      if o.isDeleted()
        if o.selection?
          console.log "You forgot to delete the selection from this operation! Please write an issue how to reproduce this bug! (it could lead to inconsistencies!)"
        o = o.next_cl
        continue
      if o.selection?
        if o.selection.from is o
          if sel_start?
            throw new Error "Found two consecutive from elements. The selections are no longer safe to use! (contact the owner of the repository)"
          else
            sel_start = pos
        if o.selection.to is o
          if sel_start?
            number_of_attrs = 0
            attrs = {}
            for n,v of o.selection.attrs
              attrs[n] = v
            result.push
              from: sel_start
              to: pos
              attrs: attrs
            sel_start = null
          else
            throw new Error "Found two consecutive to elements. The selections are no longer safe to use! (contact the owner of the repository)"
        else if o.selection.from isnt o
          throw new Error "This reference should not point to this selection, because the selection does not point to the reference. The selections are no longer safe to use! (contact the owner of the repository)"
      pos++
      o = o.next_cl
    return result

  observe: (f)->
    @_listeners.push f

  unobserve: (f)->
    @_listeners = @_listeners.filter (g)->
      f != g


if window?
  if window.Y?
    window.Y.Selections = YSelections
  else
    throw new Error "You must first import Y!"

if module?
  module.exports = YSelections
