/**
 * According to the docs, this should be in a separate js file
 * https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
 *
 * @extends AudioWorkletProcessor
 */

 class STTAudioProcessor extends AudioWorkletProcessor {
    BUFFER_SIZE = 8192;
    SAMPLE_SIZE = 128;

    constructor() {
      super();
      this._buffer = new Int16Array(this.BUFFER_SIZE);
      this._numSamples = 0;
      this._maxSamples = this.BUFFER_SIZE/this.SAMPLE_SIZE;
    }

    converFloat32ToInt16(buffer) {
      return Int16Array.from(buffer, x => x * 32767);
    }

    /**
     * Process captured channel data and send it to the main thread via message.
     * AudioWorklet captures 128-byte samples, so we accumulate them and send a 8192-byte buffer. 
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
     */
    process(inputs) {       
      if (!inputs[0] || !inputs[0][0]) {
        return true;
      }
      
      const channelData = this.converFloat32ToInt16(inputs[0][0]);

      if (this._numSamples < this._maxSamples - 1) {
        // accumulate input data to the buffer.
        this._buffer.set(channelData, this._numSamples*this.SAMPLE_SIZE);
        this._numSamples += 1;
      } else {
        // final sample, accumulate then send it to the main thread.
        this._buffer.set(channelData, this._numSamples*this.SAMPLE_SIZE);
        this._numSamples = 0;

        this.port.postMessage(this._buffer);
      }
      
      return true;  
    }
}
  
registerProcessor('stt-audio-processor', STTAudioProcessor);