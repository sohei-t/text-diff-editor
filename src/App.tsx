import {
  ThemeProvider,
  SettingsProvider,
  ToastProvider,
  EditorProvider,
  SplitProvider,
  DiffProvider,
  FileProvider,
} from './context';
import EditorApp from './components/EditorApp';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <ToastProvider>
            <FileProvider>
              <EditorProvider>
                <SplitProvider>
                  <DiffProvider>
                    <EditorApp />
                  </DiffProvider>
                </SplitProvider>
              </EditorProvider>
            </FileProvider>
          </ToastProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;
