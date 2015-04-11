


class YSelections
  constructor: ()->

  _name: "Selections"

  _getModel: (Y, Operation) ->
    if not @_model?
      @_model = new Operation.Composition(@, []).execute()
    @_model

  _setModel: (@_model)->

  _apply: (delta)->
    # TODO: currently, applies the delta _as is_.
    from = @_model.HB.getOperation delta.from
    to = @_model.HB.getOperation delta.to
    createSelection = (from, to, attrs)->
      new_attrs = {}
      for n,v of attrs
        new_attrs[n] = v
      {
        from: from
        to: to
        attrs: new_attrs
      }

    extendSelection = (selection, attrs)->
      for n,v of attrs
        selection.attrs[n] = v

    if not (from? and to?)
      console.log "wasn't able to apply the selection.."
    if delta.type is "select"
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
        # find first selection to the left
        o = from.prev_cl
        while (not o.selection?) and (o.type isnt "Delimiter")
          o = o.prev_cl
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
          o = o.next_cl

        if o is old_selection.to
          # no intersection with to!
          # create $new_selection
          new_selection = createSelection from, old_selection.to, old_selection.attrs

          extendSelection new_selection, delta.attrs
          # update references
          old_selection.to = from.prev_cl
          # update references (pointers to respective selections)
          old_selection.to.selection = old_selection
          new_selection.from.selection = new_selection
          new_selection.to.selection = new_selection
        else
          # there is an intersection with to!

          # create $new_selection
          new_selection = createSelection from, to, old_selection.attrs
          extendSelection new_selection, delta.attrs

          # create $opt_selection
          opt_selection = createSelection to.next_cl, old_selection.to, old_selection.attrs

          # update references
          old_selection.to = from.prev_cl
          # update references (pointers to respective selections)
          old_selection.to.selection = old_selection
          new_selection.from.selection = new_selection
          new_selection.to.selection = new_selection
          opt_selection.from.selection = opt_selection
          opt_selection.to.selection = opt_selection

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
          o = o.prev_cl
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
        new_selection = createSelection to.next_cl, old_selection.to, old_selection.attrs
        # extend old_selection with the new attrs
        extendSelection old_selection, delta.attrs

        # update references
        old_selection.to = to
        # update references (pointers to respective selections)
        old_selection.to.selection = old_selection
        new_selection.from.selection = new_selection
        new_selection.to.selection = new_selection

      cut_off_to()

      # 3. extend / add selections in between
      o = from
      while (o isnt to.next_cl)
        if o.selection?
          console.log "1"
          # just extend the existing selection
          extendSelection o.selection, delta.attrs
          o = o.selection.to.next_cl
        else
          # create a new selection (until you find the next one)
          console.log "2"
          start = o
          while (not o.next_cl.selection?) and (o isnt to)
            o = o.next_cl
          end = o
          selection = createSelection start, end, delta.attrs
          start.selection = selection
          end.selection = selection
          o = o.next_cl

    else if delta.type is "unselect"
      # ..
    else
      throw new Error "unsupported delta!"
    return delta # it is necessary that delta is returned in the way it was applied on the global delta.
    # so that yjs can know exactly what was applied.

  # "undo" a delta from the composition_value
  _unapply: (delta)->
    from = @_model.HB.getOperation delta.from
    to = @_model.HB.getOperation delta.to
    if not (from? and to?)
      console.log "wasn't able to unapply the selection.."
    if delta.type is "select"
      delete from.selection
      delete to.selection
    else if delta.type is "unselect"
      # ..
    else
      throw new Error "unsupported delta!"

  # update the globalDelta with delta


  # select _from_, _to_ with an _attribute_
  select: (from, to, attrs)->
    delta = # probably not as easy as this
      from: from.getUid()
      to: to.getUid()
      attrs: attrs
      type: "select"

    @_model.applyDelta(delta)

  # unselect _from_, _to_ with an _attribute_
  unselect: (from, to, attrs)->
    delta = # probably not as easy as this
      from: from.getUid()
      to: to.getUid()
      attrs: attrs
      type: "unselect"

    @_model.applyDelta(delta)

  observe: (f)->
    @_model.observe f


if window?
  if window.Y?
    window.Y.Selections = YSelections
  else
    throw new Error "You must first import Y!"

if module?
  module.exports = YSelections






