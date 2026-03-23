import { MODULE_METADATA } from '@nestjs/common/constants';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChatModule } from './chat.module';

describe('ChatModule', () => {
  it('imports WorkspacesModule for workspace guard dependencies', () => {
    const imports =
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, ChatModule) ?? [];

    expect(imports).toContain(WorkspacesModule);
  });
});
