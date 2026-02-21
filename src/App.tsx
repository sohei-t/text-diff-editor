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

function App() {
  return (
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
  );
}

export default App;
