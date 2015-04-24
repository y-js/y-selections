# compare two object for equality (no deep check!)
compare_objects = (obj1, obj2, doAgain=true)->
  for key, value of obj1
    if not (obj2[key]? and obj2[key] is value)
      return false
  if doAgain
    compare_objects(obj2, obj1, false)
  else
    true


class YSelections
  constructor: ()->
    @_listeners = []
    @_composition_value = []
    # we put all the lists we use in this array
    @_lists = []

  _name: "Selections"

  # Get the yjs model (called by yjs)
  # @return [Model] return the model
  _getModel: (Y, Operation) ->
    if not @_model?
      @_model = new Operation.Composition(@, []).execute()
    @_model

  # Set the yjs model (called by yjs)
  # @param model [Model] the model to set
  _setModel: (@_model)->

  # ???
  # @return [Object] an object .composition_value and .composition_value_operations
  _getCompositionValue: ()->
    composition_value_operations = {}
    composition_value = for value, index in @_composition_value
      composition_value_operations[""+index+"/from"] = value.from
      composition_value_operations[""+index+"/to"] = value.to
      {
        attrs: value.attrs
      }

    return {
      composition_value : composition_value
      composition_value_operations: composition_value_operations
    }

  # ???
  _setCompositionValue: (composition_value)->
    for value in composition_value
      value.type = "select"
      @_apply value

  # Apply a delta
  # @param delta [Object] the delta to apply
  # @option delta [Y.List item] from the start of the delta
  # @option delta [Y.List item] to the end of the delta
  # @option delta [String] type either "select" or "unselect"
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
    # if never applied a delta on this list, add a listener to it in order to
    # change selections if necessary
    if delta.type is "select"
      parent = from.getParent()
      parent_exists = false
      for p in @_lists
        if parent is @_lists[p]
          parent_exists = true
          break
      if not parent_exists
        @_lists.push parent
        parent.observe (events) =>
          for event in events
            if event.type is "delete"
              if event.reference.selection?
                ref = event.reference
                sel = ref.selection
                # delete it, because ref is going to get deleted!
                delete ref.selection
                # if the selection is 0-length
                if sel.from is ref and sel.to is ref
                  @_removeFromCompositionValue sel
                # if the selection started here, move it to next element
                else if sel.from is ref
                  next = ref.getNext()
                  sel.from = next
                  next.selection = sel
                # if the selection ends here, move it to previous element
                else if sel.to is ref
                  prev = ref.getPrev()
                  sel.to = prev
                  prev.selection = sel
                else
                  throw new Error "Found weird inconsistency! Y.Selections is
                    no longer safe to use!"
              next = event.reference.getNext()
              if next.selection?
                @_combine_selection_to_left next.selection

    # notify listeners:
    observer_call =
      from:  from
      to:    to
      type:  delta.type
      attrs: delta.attrs
    for listener in @_listeners
      listener.call this, observer_call

    # create a new selection and add it to the stack of composition values
    createSelection = (from, to, attrs)=>
      new_attrs = {}
      for key,value of attrs
        new_attrs[key] = value
      new_sel =
        from:  from
        to:    to
        attrs: new_attrs
      @_composition_value.push new_sel
      new_sel

    # is extend the right name?
    extendSelection = (selection)->
      # remove the attributes from the selection
      if delta.type is "unselect"
        undo_attrs = {}
        for key in delta.attrs
          if selection.attrs[key]?
            undo_attrs[key] = selection.attrs[key]
          delete selection.attrs[key]
        # add the operation to recreate it
        undos.push
          from:  delta.from
          to:    delta.to
          attrs: undo_attrs
          type:  "select"
      else
        undo_attrs = {} # for undo selection (overwrite of existing selection)
        undo_attrs_list = [] # for undo selection (not overwrite)
        undo_need_unselect = false
        undo_need_select = false
        if delta.overwrite? and delta.overwrite
          # overwrite everything that the delta doesn't expect
          for key, value of selection.attrs
            if not delta.attrs[n]?
              undo_need_select = true
              undo_attrs[key] = value
              # must not delete attributes of $selection.attrs in this loop,
              # so we do it in the next one
          for n,v of undo_attrs
            delete selection.attrs[key]

        # apply the delta on the selection
        for key, value of delta.attrs
          if selection.attrs[key]?
            undo_attrs[key] = selection.attrs[key]
            undo_need_select = true
          # if key not already defined reversing it is like unselecting it
          else
            undo_attrs_list.push key
            undo_need_unselect = true
          selection.attrs[key] = value
        # push all the undos to $undos
        if undo_need_select
          undos.push
            from:  selection.from
            to:    selection.to
            attrs: undo_attrs
            type:  "select"
        if undo_need_unselect
          undos.push
            from:  selection.from
            to:    selection.to
            attrs: undo_attrs_list
            type:  "unselect"

    # Algorithm overview:
    # 1. cut off the selection that intersects with from
    # 2. cut off the selection that intersects with to
    # 3. extend / add selections in between
    #
    #### 1. cut off the selection that intersects with from
    #
    cut_off_from = ()->
      # check if a selection (to the left of $from) intersects with $from
      if from.selection? and from.selection.from is from
        # does not intersect, because the start is already selected
        return
      # find first element that has a delimiter (and stop if its a delimiter,
      # a.k.a the end of the list)
      element = from.prev_cl
      while (not element.selection?) and (element.type isnt "Delimiter")
        element = element.prev_cl
      # if the element has no selection (looped all over the list)
      # or is an *endpoint* of a selection, there is no intersection
      if (not element.selection?) or element.selection.to is element
        return

      # We found a selection that intersects with $from.
      # Now we have to check if it also intersects with $to.
      # Then we cut it in such a way, that the selection does not intersect
      # with $from and $to anymore.

      # this is a reference for the selections that are created/modified:
      # old_selection is outer (not between $from $to)
      #   - will be changed in such a way that it is to the left of $from
      # new_selection is inner (inbetween $from $to)
      #   - created, right after $from
      # opt_selection is outer (after $to)
      #   - created (if necessary), right after $to
      old_selection = element.selection

      # check if found selection also intersects with $to
      # * starting from $from, go to the right until you found either $to or old_selection.to
      # ** if $to: no intersection with $to
      # ** if $old_selection.to: intersection with $to!
      element = from
      while (element isnt old_selection.to) and (element isnt to)
        element = element.getNext()

      if element is old_selection.to
        # no intersection with to!
        # create $new_selection
        new_selection = createSelection from, old_selection.to, old_selection.attrs

        # update references
        old_selection.to = from.getPrev()
        # update references (pointers to respective selections)
        old_selection.to.selection = old_selection

        # set references of new_selection
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
      element = to
      while (not element.selection?) and (element isnt from)
        element = element.getPrev()
      if (not element.selection?) or element.selection["to"] is element
        # no intersection
        return
      # We found a selection that intersects with $to.
      # Now we have to cut it in such a way that the selection does not
      # intersect with $to anymore.

      # this is a reference for the selections that are created/modified:
      # it is similar to the one above, except that we do not need opt_selection
      # anymore!
      # old_selection is inner (between $from and $to)
      #   - will be changed in such a way that it is to the left of $to
      # new_selection is outer ( outer $from and $to)
      #   - created, right after $to

      old_selection = element.selection

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
    elem = from
    to_next = to.getNext()
    # loop in the selection delimited by the delta
    while (elem isnt to_next)
      if elem.selection?
        # just extend the existing selection
        extendSelection elem.selection, delta # will push undo-deltas to $undos
        selection = elem.selection
        @_combine_selection_to_left selection

        elem = selection.to.getNext()
        selection_is_empty = true
        for attr of selection.attrs
          selection_is_empty = false
          break
        if selection_is_empty
          @_removeFromCompositionValue selection
      else
        # create a new selection (until you find the next one)
        start = elem
        elem_next = elem.getNext()
        while (not elem_next.selection?) and (elem isnt to)
          elem = elem_next
          elem_next = elem.getNext()
        end = elem
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
          @_combine_selection_to_left elem.selection
        elem = elem.getNext()

    # find the next selection
    while elem.isDeleted() and (not elem.selection?)
      elem = elem.next_cl
    # and check if you can combine it
    if elem.selection?
      @_combine_selection_to_left elem.selection
    # also re-connect from
    if from.selection?
      @_combine_selection_to_left from.selection

    return undos # it is necessary that delta is returned in the way it was applied on the global delta.
    # so that yjs knows exactly what was applied (and how to undo it).

  # ???
  _removeFromCompositionValue: (selectionToRemove)->
    @_composition_value = @_composition_value.filter (sel)->
      sel isnt selectionToRemove
    delete selectionToRemove.from.selection
    delete selectionToRemove.to.selection

  # Try to combine a selection to the selection to its left (if any)
  # @param [Option] selection the selection to try to combine
  # @param selection [Y.List item] from the start of the selection
  # @param selection [Y.List item] to the end of the selection
  # @param selection [Object] attrs the attributes of the selection
  _combine_selection_to_left: (sel)->
    first_elem = sel.from.getPrev()
    if not first_elem.selection?
      # there is no selection to the left
      return
    else
      # if they have the sames attributes, merge them
      if compare_objects(first_o.selection.attrs, sel.attrs)
        # we are going to remove the left selection
        # First, remove every trace of first_o.selection (save what is necessary)
        # Then, re-set sel.from
        new_from = first_o.selection.from
        @_removeFromCompositionValue first_o.selection

        # delete old selection
        if sel.from isnt sel.to
          delete sel.from.selection

        # bind new selection
        sel.from = new_from
        new_from.selection = sel
      else
        return

  # Apply undoing deltas (does the same as _apply)
  # @param deltas [Array<Delta>] the deltas to unapply
  _unapply: (deltas)->
    # _apply returns a _list_ of deltas, that are necessary to undo the change.
    # Now we _apply every delta in the list (and discard the results)
    for delta in deltas
      @_apply delta
    return

  # select _from_ _to_ with an _attribute_
  # @param from [Y.List item] the start of the selection
  # @param to [Y.List item] the end of the selection
  # @param attrs [Object] the attributes of the selection
  select: (from, to, attrs, overwrite)->
    length = 0
    for a of attrs
      length++
      break
    if length <= 0 and not (overwrite? and overwrite)
      return

    delta_operations =
      from: from
      to:   to
    delta =
      attrs: attrs
      type:  "select"

    if overwrite? and overwrite
      delta.overwrite = true

    @_model.applyDelta(delta, delta_operations)

  unselectAll: (from, to)->
    select from, to, {}, true

  # unselect _from_ _to_ with an _attribute_, resulting in the removal of the
  # of any selection within these bounds.
  # @param from [Y.List item] the start of the selection
  # @param to [Y.List item] the end of the selection
  # @param attrs [Object] the attributes of the selection
  unselect: (from, to, attrs)->
    if typeof attrs is "string"
      attrs = [attrs]
    if attrs.constructor isnt Array
      throw new Error "Y.Selections.prototype.unselect expects an Array or
        String as the third parameter (attributes)!"
    if attrs.length <= 0
      return
    delta_operations =
      from: from
      to:   to
    delta =
      attrs: attrs
      type:  "unselect"

    @_model.applyDelta(delta, delta_operations)

  # Get all the selections covering the argument
  # @param list [Y.List] a doubly-chained list of items where to look for selections
  # @return [Array<Selection>]
  # @note the function also check the consistency of the selections
  getSelections: (list)->
    element = list.ref(0)
    if not element?
      return []

    sel_start = null
    pos = 0
    result = []

    # go through the list element by element
    while element.next_cl?
      # check that a deleted element has no selection bounded anymore
      if element.isDeleted()
        if element.selection?
          throw new Error "You forgot to delete the selection from this
            operation! y-selections is no longer safe to use!"
        # deleted element, jump to element
        element = element.next_cl
        continue
      if element.selection?
        # if a selection starts here, save the start position
        if element.selection.from is element
          if sel_start?
            throw new Error "Found two consecutive from elements. The selections
              are no longer safe to use! (contact the owner of the repository)"
          else
            sel_start = pos
        # if a selection ends here, add it to return value
        if element.selection.to is element
          if sel_start?
            number_of_attrs = 0
            attrs = {}
            for key,value of element.selection.attrs
              attrs[key] = value
            result.push
              from:  sel_start
              to:    pos
              attrs: attrs
            sel_start = null
          else
            throw new Error "Found two consecutive to elements. The selections 
              are no longer safe to use! (contact the owner of the repository)"
        # can it happen since we checked that element.Selection.from is element
        else if element.selection.from isnt element
          throw new Error "This reference should not point to this selection,
            because the selection does not point to the reference. The
            selections are no longer safe to use! (contact the owner of the
            repository)"
      pos++
      element = element.next_cl
    return result

  # Observe the selection with the function
  # @param fun [Function] the listening function
  observe: (fun)->
    @_listeners.push fun

  # Remove the function from the observers
  # @param fun [Function] the function to remove
  unobserve: (fun)->
    @_listeners = @_listeners.filter (otherFun)->
      fun != otherFun


if window?
  if window.Y?
    window.Y.Selections = YSelections
  else
    throw new Error "You must first import Y!"

if module?
  module.exports = YSelections
