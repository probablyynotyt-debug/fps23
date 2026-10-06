/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FPSPlayerViewer } from './components/FPSPlayerViewer';

export default function App() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#0e1117] select-none touch-none">
      <FPSPlayerViewer />
    </main>
  );
}
