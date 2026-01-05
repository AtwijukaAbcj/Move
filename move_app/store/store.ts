import { configureStore } from "@reduxjs/toolkit";
import moveReducer from "./moveSlices";

export const store = configureStore({
  reducer: {
    move: moveReducer,
  },
});
