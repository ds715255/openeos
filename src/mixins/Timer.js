import { parseEosDuration } from '../util'

let idCounter = 0

export default {
  data: () => ({
    timers: [],
  }),
  methods: {
    purgePageTimers() {
      for (let i = this.timers.length - 1; i >= 0; i--) {
        if (!this.timers[i].persist) {
          this.timers.splice(i, 1)
        }
      }
    },
    removeTimer(timerId) {
      if (!timerId) return
      this.timers = this.timers.filter(t => t.id !== timerId)
    },
    getTimerById(timerId) {
      return this.timers.find(t => t.id === timerId)
    },
    installTimer(interpreter, globalObject) {
      const vue = this
      const constructor = opt => {
        const optProps = opt.properties
        let timerId = '__timer_' + ++idCounter
        console.log('Creating timer')
        const timer = interpreter.createObjectProto(proto)
        for (var i in optProps) {
          // Copy source props to our new timer
          const pseudoVal = optProps[i]
          if (pseudoVal instanceof this.Interpreter.Object) {
            // Convert Interpreter objects to native
            timer[i] = interpreter.pseudoToNative(pseudoVal)
          } else if (typeof pseudoVal === 'object') {
            // Copy other objects as-is
            timer[i] = pseudoVal
          } else {
            // Make other props reactive
            vue.$set(timer, i, pseudoVal)
          }
          interpreter.setProperty(timer, i, pseudoVal)
        }
        interpreter.setProperty(timer, 'id', timerId)
        const duration = parseEosDuration(timer.duration)
        timer.duration = duration
        timer.timeLeft = duration
        timer.id = timerId
        timer.onTimeout = () => {
          if (timer.properties.onTimeout) {
            // onTimeout callback provided by interperted code
            // (interpreter has been doing other things while our timer was running)
            interpreter.queueFunction(timer.properties.onTimeout, opt)
            vue.removeTimer(timer.id)
            interpreter.run()
          }
          if (timer.properties.onContinue) {
            interpreter.queueFunction(timer.properties.onContinue, opt)
            vue.removeTimer(timer.id)
            interpreter.run()
          }
        }
        timer.onThreshold = t => {
          if (timer.properties.onThreshold) {
            interpreter.queueFunction(timer.properties.onThreshold, timer, t)
            interpreter.run()
          }
        }
        this.timers.push(timer)
        return timer
      }

      const manager = interpreter.createNativeFunction(constructor, true)
      interpreter.setProperty(
        manager,
        'prototype',
        interpreter.createObject(globalObject.properties['EventTarget']),
        this.Interpreter.NONENUMERABLE_DESCRIPTOR
      )
      const proto = manager.properties['prototype']
      interpreter.setProperty(globalObject, 'Timer', manager)

      interpreter.setProperty(
        manager,
        'get',
        interpreter.createNativeFunction(id => {
          if (typeof id !== 'string') {
            throw new TypeError('id must be a string')
          }
          return this.getTimerById(id)
        }),
        this.Interpreter.NONENUMERABLE_DESCRIPTOR
      )

      interpreter.setProperty(
        manager,
        'getAll',
        interpreter.createNativeFunction(() => {
          return interpreter.arrayNativeToPseudo(Object.keys(this.timers))
        }),
        this.Interpreter.NONENUMERABLE_DESCRIPTOR
      )

      interpreter.setNativeFunctionPrototype(manager, 'stop', function() {
        vue.removeTimer(this.id)
      })

      interpreter.setNativeFunctionPrototype(
        manager,
        'getTimeLeft',
        function() {
          return this.timeLeft
        }
      )

      interpreter.setNativeFunctionPrototype(
        manager,
        'getDurration',
        function() {
          return this.durration
        }
      )
    },
  },
}