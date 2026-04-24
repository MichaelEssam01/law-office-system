namespace LawOffice.Application.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    IRepository<T> Repository<T>() where T : LawOffice.Domain.Common.BaseEntity;
    Task<int> CompleteAsync();
}
