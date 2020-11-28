// Load Interpreter
import acorn from './acorn'
import { Interpreter } from './interpreter'

Interpreter.prototype.parseCode = function(code) {
  return acorn.parse(code, Interpreter.PARSE_OPTIONS)
}

// const interpreter = new Interpreter('')
// // Replace run with "threaded" run
// interpreter.__isR = false
// interpreter.run = function(inLoop) {
//   let ticks = 10 // Only run up to 10 interpreter ticks at a time
//   while (!this.paused_ && this.step()) {
//     interpreter.__isR = true
//     ticks--
//     if (!ticks) {
//       inLoop = false
//       setTimeout(function() {
//         interpreter.run.call(interpreter, true)
//       })
//       break
//     }
//     //
//   }
//   if (!ticks || inLoop) interpreter.__isR = false
//   return this.paused_
// }

/**
 * Execute the interpreter to program completion.  Vulnerable to infinite loops.
 * @return {boolean} True if a execution is asynchronously blocked,
 *     false if no more instructions.
 */
Interpreter.prototype.run = function() {
  if (this.running_) return this.paused_
  this.running_ = true
  try {
    while (!this.paused_ && this.step()) {
      //
    }
  } catch (e) {
    this.running_ = false
    throw e
  }
  this.running_ = false
  return this.paused_
}

export default Interpreter