import { Test, TestingModule } from '@nestjs/testing';
import { AnonymousIdentityService } from './anonymous-identity.service';

describe('AnonymousIdentityService', () => {
  let service: AnonymousIdentityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnonymousIdentityService],
    }).compile();

    service = module.get<AnonymousIdentityService>(AnonymousIdentityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
