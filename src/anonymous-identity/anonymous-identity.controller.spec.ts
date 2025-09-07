import { Test, TestingModule } from '@nestjs/testing';
import { AnonymousIdentityController } from './anonymous-identity.controller';

describe('AnonymousIdentityController', () => {
  let controller: AnonymousIdentityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnonymousIdentityController],
    }).compile();

    controller = module.get<AnonymousIdentityController>(AnonymousIdentityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
