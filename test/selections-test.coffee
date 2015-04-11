chai      = require('chai')
expect    = chai.expect
should    = chai.should()
sinon     = require('sinon')
sinonChai = require('sinon-chai')
_         = require("underscore")

chai.use(sinonChai)
Y = require "../../yjs/lib/y"
Y.List = require "../../y-list/lib/y-list.coffee"
Y.Selections = require "../lib/y-selections"

Connector = require "../../y-test/lib/y-test.coffee"

TestSuite = require "../../yjs/test/TestSuite"

class SelectionsTest extends TestSuite

  constructor: (suffix)->
    super suffix, Y

  type: "SelectionsTest"

  makeNewUser: (userId)->
    conn = new Connector userId
    new Y conn

  initUsers: (u)->
    u.val("selections",new Y.Selections())
    u.val("list", new Y.List([1,2,3,4,5,6,7,8,9,10]))

  getRandomRoot: (user_num)->
    @users[user_num].val("TextTest")

  getContent: (user_num)->
    @users[user_num].val("TextTest").val()

describe "Selections Test", ->
  @timeout 500000

  beforeEach (done)->
    @yTest = new SelectionsTest()
    done()

  it "selected two elements, checked for pointers", ->
    l = @yTest.users[0].val("list")
    l_left = l.ref(1)
    l_right = l.ref(2)
    sel = @yTest.users[0].val("selections")
    sel.select(l_left, l_right, {"my_attr":"black"})
    expect(l.ref(1).selection.from).to.equal(l.ref(1))
    expect(l.ref(1).selection.to).to.equal(l.ref(2))
    expect(l.ref(2).selection.from).to.equal(l.ref(1))
    expect(l.ref(2).selection.to).to.equal(l.ref(2))

  it "selected two elements, checked for pointers (foreign user)", ->
    l = @yTest.users[0].val("list")
    l_left = l.ref(1)
    l_right = l.ref(2)
    sel = @yTest.users[0].val("selections")
    sel.select(l_left, l_right, {"c": "blue"})
    @yTest.flushAll()
    l = @yTest.users[1].val("list")
    expect(l.ref(1).selection.from).to.equal(l.ref(1))
    expect(l.ref(1).selection.to).to.equal(l.ref(2))
    expect(l.ref(2).selection.from).to.equal(l.ref(1))
    expect(l.ref(2).selection.to).to.equal(l.ref(2))

  describe "Intersection of selections:", ->
    it "intersected two elements, checked for pointers and attrs (strict inner overwrite)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(4)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(3)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      @yTest.flushAll()
      # inner selection is the same
      expect(l.ref(2).selection).to.equal(l.ref(3).selection)

      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(1))
      expect(l.ref(4).selection.from).to.equal(l.ref(4))
      expect(l.ref(4).selection.to).to.equal(l.ref(4))
      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(3).selection.attrs.c).to.equal("blue")
      expect(l.ref(1).selection.attrs.c).to.equal("black")
      expect(l.ref(4).selection.attrs.c).to.equal("black")

    it "intersected two elements (minimal), checked for pointers and attrs (strict inner overwrite)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      @yTest.flushAll()
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(3).selection.attrs.c).to.equal("black")
      expect(l.ref(1).selection.attrs.c).to.equal("black")

    it "intersected two elements, checked for pointers and attrs (inner overwrite, left non-strict, right strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.attrs.c).to.equal("blue")
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(3).selection.attrs.c).to.equal("black")

    it "intersected two elements (minimal), checked for pointers and attrs (inner overwrite, left non-strict, right strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(1)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.attrs.c).to.equal("blue")
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(1).selection.attrs.c).to.equal("blue")
      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(3).selection.attrs.c).to.equal("black")


    it "intersected two elements, checked for pointers and attrs (inner overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.attrs.c).to.equal("blue")
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(0).selection.attrs.c).to.equal("black")

    it "intersected two elements (minimal), checked for pointers and attrs (inner overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      @yTest.flushAll()
      expect(l.ref(1).selection).to.equal(l.ref(0).selection)

      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(0).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.from).to.equal(l.ref(0))

      expect(l.ref(2).selection.attrs.c).to.equal("blue")
      expect(l.ref(0).selection.attrs.c).to.equal("black")

    it "intersected two elements, checked for pointers and attrs (strict outer overwrite)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(3)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(4)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      @yTest.flushAll()

      expect(l.ref(2).selection).to.equal(l.ref(3).selection)

      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(3).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("black")

      expect(l.ref(1).selection).not.to.equal(l.ref(2).selection)
      expect(l.ref(3).selection).not.to.equal(l.ref(4).selection)

      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(3).selection.attrs.c).to.equal("black")
      expect(l.ref(1).selection.attrs.c).to.equal("black")

    it "intersected two elements (minimal), checked for pointers and attrs (strict outer overwrite)", ->

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      @yTest.flushAll()
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(3).selection.attrs.c).to.equal("black")
      expect(l.ref(1).selection.attrs.c).to.equal("black")

    it "intersected two elements, checked for pointers and attrs (outer overwrite, left non-strict, right strict)", ->

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})


      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.attrs.c).to.equal("black")
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(3).selection.attrs.c).to.equal("black")

    it "intersected two elements (minimal), checked for pointers and attrs (outer overwrite, left non-strict, right strict)", ->

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(1)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})


      @yTest.flushAll()
      expect(l.ref(2).selection).to.equal(l.ref(3).selection)

      expect(l.ref(1).selection).not.to.equal(l.ref(2).selection)

      expect(l.ref(1).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(3).selection.from).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(3).selection.attrs.c).to.equal("black")
      expect(l.ref(1).selection.attrs.c).to.equal("black")

    it "intersected two elements, checked for pointers and attrs (outer overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.attrs.c).to.equal("black")
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(0).selection.attrs.c).to.equal("black")

    it "intersected two elements (minimal), checked for pointers and attrs (outer overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      @yTest.flushAll()

      expect(l.ref(0).selection).to.equal(l.ref(1).selection)

      expect(l.ref(1).selection).not.to.equal(l.ref(2).selection)

      expect(l.ref(0).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.from).to.equal(l.ref(0))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(0).selection.attrs.c).to.equal("black")
      expect(l.ref(1).selection.attrs.c).to.equal("black")

  describe "Unselections", ()->
    it "intersected a selection, checked for pointers and attrs (strict inner overwrite)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(4)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(3)
      @yTest.users[0].val("selections").unselect(l_left, l_right, ["c"])

      @yTest.flushAll()
      # inner selection is the same
      expect(l.ref(2).selection).to.equal(l.ref(3).selection)

      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(1))
      expect(l.ref(4).selection.from).to.equal(l.ref(4))
      expect(l.ref(4).selection.to).to.equal(l.ref(4))
      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.equal("black")
      expect(l.ref(4).selection.attrs.c).to.equal("black")

    it "intersected a selection (minimal), checked for pointers and attrs (strict inner overwrite)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.equal("black")
      expect(l.ref(1).selection.attrs.c).to.equal("black")

    it "intersected a selection, checked for pointers and attrs (inner overwrite, left non-strict, right strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.attrs.c).to.be.undefined
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.equal("black")

    it "intersected a selection (minimal), checked for pointers and attrs (inner overwrite, left non-strict, right strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(1)
      @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(1))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(1).selection.attrs.c).to.be.undefined
      expect(l.ref(2).selection.attrs.c).to.equal("black")
      expect(l.ref(3).selection.attrs.c).to.equal("black")


    it "intersected a selection, checked for pointers and attrs (inner overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.attrs.c).to.be.undefined
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(0).selection.attrs.c).to.equal("black")

    it "intersected a selection (minimal), checked for pointers and attrs (inner overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").select(l_left, l_right, {"c": "black"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(1).selection).to.equal(l.ref(0).selection)

      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(0).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.from).to.equal(l.ref(0))

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(0).selection.attrs.c).to.equal("black")

    it "intersected a selection, checked for pointers and attrs (strict outer overwrite)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(3)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(4)
      sel = @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()

      expect(l.ref(2).selection).to.equal(l.ref(3).selection)

      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(3).selection.from).to.equal(l.ref(2))

      expect(l.ref(1).selection).not.to.equal(l.ref(2).selection)
      expect(l.ref(3).selection).not.to.equal(l.ref(4).selection)

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.be.undefined

    it "intersected a selection (minimal), checked for pointers and attrs (strict outer overwrite)", ->

      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.be.undefined

    it "intersected a selection, checked for pointers and attrs (outer overwrite, left non-strict, right strict)", ->

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").unselect(l_left, l_right, "c")


      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.be.undefined

    it "intersected a selection (minimal), checked for pointers and attrs (outer overwrite, left non-strict, right strict)", ->

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(1)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(3)
      sel = @yTest.users[0].val("selections").unselect(l_left, l_right, "c")


      @yTest.flushAll()
      expect(l.ref(2).selection).to.equal(l.ref(3).selection)

      expect(l.ref(1).selection).not.to.equal(l.ref(2).selection)

      expect(l.ref(1).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(3))
      expect(l.ref(3).selection.from).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(3).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.be.undefined

    it "intersected a selection, checked for pointers and attrs (outer overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(1)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()
      expect(l.ref(1).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.from).to.equal(l.ref(1))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(1).selection.to).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.be.undefined
      expect(l.ref(0).selection.attrs.c).to.be.undefined

    it "intersected a selection (minimal), checked for pointers and attrs (outer overwrite, right non-strict, left strict)", ->
      l = @yTest.users[0].val("list")
      l_left = l.ref(2)
      l_right = l.ref(2)
      @yTest.users[0].val("selections").select(l_left, l_right, {"c": "blue"})

      l = @yTest.users[0].val("list")
      l_left = l.ref(0)
      l_right = l.ref(2)
      sel = @yTest.users[0].val("selections").unselect(l_left, l_right, "c")

      @yTest.flushAll()

      expect(l.ref(0).selection).to.equal(l.ref(1).selection)

      expect(l.ref(1).selection).not.to.equal(l.ref(2).selection)

      expect(l.ref(0).selection.to).to.equal(l.ref(1))
      expect(l.ref(1).selection.from).to.equal(l.ref(0))
      expect(l.ref(2).selection.to).to.equal(l.ref(2))
      expect(l.ref(2).selection.from).to.equal(l.ref(2))

      expect(l.ref(2).selection.attrs.c).to.be.undefined
      expect(l.ref(1).selection.attrs.c).to.be.undefined
      expect(l.ref(0).selection.attrs.c).to.be.undefined

module.exports = SelectionsTest






















