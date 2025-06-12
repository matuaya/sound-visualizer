import { PvRecorder } from "@picovoice/pvrecorder-node";

const FRAME_SIZE = 512;

export const recorder = new PvRecorder(FRAME_SIZE);
